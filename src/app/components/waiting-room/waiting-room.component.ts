import { Component, OnInit, OnDestroy, HostListener } from '@angular/core'; // <-- Added OnDestroy here
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { environment } from '@env/environment';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './waiting-room.component.html',
  styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  // <-- Added OnDestroy here
  roomCode: string | null = '';
  localNickname: string | null = '';
  roomDetails: any = null;
  players: any[] = [];

  availableItems: any[] = [];
  rankedItems: any[] = [];
  officialItems: any[] = [];
  results: any[] = [];
  itemsLoaded: boolean = false;
  hasSubmitted: boolean = false;
  allPlayerPicks: { nickname: string; picks: string[] }[] = [];
  isCopied: boolean = false;

  pollingInterval: any;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.paramMap.get('code');

    // THE FIX: Must be localStorage for Beta 1.1!
    this.localNickname = localStorage.getItem('nickname');

    if (!this.localNickname) {
      this.router.navigate(['/']);
      return;
    }

    this.fetchData();

    // The Polling Interval
    this.pollingInterval = setInterval(() => {
      this.fetchData();
    }, 3000);
  }

  ngOnDestroy(): void {
    // Stops the timer if they leave the page
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  /**
   * THE FIX: When you look back at your phone, it grabs the green ticks.
   */
  @HostListener('document:visibilitychange', [])
  onVisibilityChange() {
    if (document.visibilityState === 'visible' && this.roomCode) {
      this.fetchData();
    }
  }

  fetchData() {
    if (!this.roomCode) return;

    this.http
      .get(`${environment.apiUrl}/api/lobby/${this.roomCode}`)
      .subscribe({
        next: (room: any) => {
          this.roomDetails = room;
          if (
            this.roomDetails.status === 'LOCKED' &&
            this.allPlayerPicks.length === 0
          ) {
            this.fetchAllPicks();
          }
          if (this.roomDetails.status === 'REVEALED') {
            this.fetchResults();
          }
          if (this.roomDetails?.topic && !this.itemsLoaded) {
            this.loadTopicItems();
          }
        },
      });

    this.http
      .get<any[]>(`${environment.apiUrl}/api/lobby/${this.roomCode}/players`)
      .subscribe({
        next: (data) => {
          this.players = data;
          const me = this.players.find(
            (p) =>
              p.nickname?.toLowerCase() === this.localNickname?.toLowerCase(),
          );
          if (me && me.hasSubmitted) {
            this.hasSubmitted = true;
          }
        },
      });
  }

  loadTopicItems() {
  if (!this.roomCode || !this.localNickname) return;

  this.http.get<string[]>(`${environment.apiUrl}/api/lobby/${this.roomCode}/items`).subscribe({
    next: (allItems) => {
      
      // --- THE MISSING LINE: POPULATE THE HOST'S LIST ---
      this.officialItems = allItems.map(name => ({ itemName: name }));
      // --------------------------------------------------

      this.http.get<string[]>(`${environment.apiUrl}/api/lobby/${this.roomCode}/picks/${this.localNickname}`).subscribe({
        next: (myPicks) => {
          if (myPicks && myPicks.length > 0) {
            this.rankedItems = myPicks.map(name => ({ itemName: name }));
            this.availableItems = allItems
              .filter(name => !myPicks.includes(name))
              .map(name => ({ itemName: name }));
          } else {
            this.availableItems = allItems.map(name => ({ itemName: name }));
            this.rankedItems = [];
          }
          this.itemsLoaded = true;
        }
      });
    }
  });
}

  // --- NEW: Copy to Clipboard Logic ---
  copyRoomCode() {
    if (this.roomCode) {
      navigator.clipboard.writeText(this.roomCode).then(() => {
        this.isCopied = true;
        // Turns back to the clipboard icon after 2 seconds
        setTimeout(() => (this.isCopied = false), 2000);
      });
    }
  }

  // --- NEW: Back to Dashboard ---
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  onSubmitPredictions() {
    if (!this.roomCode || !this.localNickname) return;
    if (this.availableItems.length > 0) {
      alert('You must rank ALL items before locking in your picks!');
      return;
    }

    const predictionPayload = this.rankedItems.map((item) => item.itemName);
    this.http
      .post(
        `${environment.apiUrl}/api/lobby/${this.roomCode}/submit?nickname=${this.localNickname}`,
        predictionPayload,
      )
      .subscribe({
        next: () => {
          this.hasSubmitted = true;
          this.fetchData();
        },
        error: (err) => alert('Failed to save picks. Check console.'),
      });
  }

  onLockRoom() {
    this.http
      .post(`${environment.apiUrl}/api/lobby/${this.roomCode}/lock`, {})
      .subscribe({
        next: () => this.fetchData(),
      });
  }

  onPostOfficialResults() {
    const officialPayload = this.officialItems.map((i) => i.itemName);
    this.http
      .post(
        `${environment.apiUrl}/api/lobby/${this.roomCode}/set-results`,
        officialPayload,
      )
      .subscribe({
        next: () => this.fetchData(),
        error: (err) => alert('Failed to post results'),
      });
  }

  fetchResults() {
    this.http
      .get<any[]>(`${environment.apiUrl}/api/lobby/${this.roomCode}/results`)
      .subscribe({
        next: (data) => (this.results = data),
      });
  }

  get isLocalPlayerHost(): boolean {
    const me = this.players.find(
      (p) => p.nickname?.toLowerCase() === this.localNickname?.toLowerCase(),
    );
    return me ? me.host || me.isHost : false;
  }

  get allPlayersReady(): boolean {
    return this.players.length > 0 && this.players.every((p) => p.hasSubmitted);
  }

  onEditPicks() {
    this.http
      .post(
        `${environment.apiUrl}/api/lobby/${this.roomCode}/unsubmit?nickname=${this.localNickname}`,
        {},
      )
      .subscribe({
        next: () => {
          this.hasSubmitted = false;
          this.fetchData();
        },
        error: (err) => alert('Error trying to edit picks.'),
      });
  }

  fetchAllPicks() {
    this.http
      .get<any>(`${environment.apiUrl}/api/lobby/${this.roomCode}/all-picks`)
      .subscribe({
        next: (data) => {
          this.allPlayerPicks = Object.keys(data).map((key) => ({
            nickname: key,
            picks: data[key],
          }));
        },
      });
  }

  onRevealConsensus() {
    this.http
      .post(
        `${environment.apiUrl}/api/lobby/${this.roomCode}/reveal-consensus`,
        {},
      )
      .subscribe({
        next: () => this.fetchData(),
        error: (err) => console.error('Reveal failed', err),
      });
  }
}
