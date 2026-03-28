import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { environment } from '@env/environment'; // THE FIX: Imported environment

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './waiting-room.component.html',
  styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  // --- Room & Player Info ---
  roomCode: string | null = '';
  localNickname: string | null = '';
  roomDetails: any = null;
  players: any[] = [];

  // --- Game State ---
  availableItems: any[] = []; // Left list
  rankedItems: any[] = []; // Right list
  officialItems: any[] = []; // Host's final ranking list
  results: any[] = []; // Final scoreboard
  itemsLoaded: boolean = false;
  hasSubmitted: boolean = false;
  allPlayerPicks: { nickname: string; picks: string[] }[] = [];

  // --- Polling ---
  pollingInterval: any;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.paramMap.get('code');
    this.localNickname = sessionStorage.getItem('nickname');

    // Security: If they somehow landed here without a nickname, send them back to Lobby
    if (!this.localNickname) {
      this.router.navigate(['/']);
      return;
    }

    this.fetchData();
    // // Radar ping every 3 seconds to update player list and room status
    // this.pollingInterval = setInterval(() => this.fetchData(), 3000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  /**
   * Main data hub: Fetches Room info and Player statuses
   */
  fetchData() {
    if (!this.roomCode) return;

    // 1. Get Room Details (Mode, Topic, Status)
    this.http
      .get(`${environment.apiUrl}/api/lobby/${this.roomCode}`) // ENVIRONMENT SWAP
      .subscribe({
        next: (room: any) => {
          this.roomDetails = room;

          if (
            this.roomDetails.status === 'LOCKED' &&
            this.allPlayerPicks.length === 0
          ) {
            this.fetchAllPicks();
          }

          // REVEAL TRIGGER: If the room is finished, get the scores and stop polling!
          if (this.roomDetails.status === 'REVEALED') {
            this.fetchResults();
            if (this.pollingInterval) clearInterval(this.pollingInterval);
          }

          // RECONNECT FIX: If topic is known but teams aren't loaded, fetch them
          if (this.roomDetails?.topic && !this.itemsLoaded) {
            this.loadTopicItems();
          }
        },
      });

    // 2. Get Players List & Sync Submission Status
    this.http
      .get<any[]>(`${environment.apiUrl}/api/lobby/${this.roomCode}/players`) // ENVIRONMENT SWAP
      .subscribe({
        next: (data) => {
          this.players = data;

          // NULL-SAFE FIX: Added '?' to handle players with missing nicknames
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
    if (!this.roomCode) return; // Safety check

    this.http
      .get<string[]>(`${environment.apiUrl}/api/lobby/${this.roomCode}/items`) // ENVIRONMENT SWAP
      .subscribe({
        next: (items) => {
          console.log('Items loaded for room:', items);
          this.availableItems = items.map((name) => ({ itemName: name }));
          this.officialItems = [...this.availableItems];

          // CRITICAL: Set this to true so fetchData() doesn't call this again
          this.itemsLoaded = true;
        },
        error: (err) => {
          console.error('Could not load items from the room:', err);
        },
      });
  }

  // --- DRAG AND DROP LOGIC ---
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

  // --- ACTIONS ---

  onSubmitPredictions() {
    // 1. Basic safety check
    if (!this.roomCode || !this.localNickname) return;

    // 2. THE FIX: Refuse submission if any items are left unranked!
    if (this.availableItems.length > 0) {
      alert('You must rank ALL items before locking in your picks!');
      return;
    }

    const predictionPayload = this.rankedItems.map((item) => item.itemName);

    this.http
      .post(
        `${environment.apiUrl}/api/lobby/${this.roomCode}/submit?nickname=${this.localNickname}`, // ENVIRONMENT SWAP
        predictionPayload,
      )
      .subscribe({
        next: () => {
          this.hasSubmitted = true;
          this.fetchData();
        },
        error: (err) => {
          console.error('Submission error:', err);
          alert('Failed to save picks. Check console.');
        },
      });
  }

  onLockRoom() {
    this.http
      .post(`${environment.apiUrl}/api/lobby/${this.roomCode}/lock`, {}) // ENVIRONMENT SWAP
      .subscribe({
        next: () => {
          console.log('Room Locked By Host');
        },
      });
  }

  onPostOfficialResults() {
    // Send the officialItems array (which the host just ordered) to the backend
    const officialPayload = this.officialItems.map((i) => i.itemName);

    this.http
      .post(
        `${environment.apiUrl}/api/lobby/${this.roomCode}/set-results`, // ENVIRONMENT SWAP
        officialPayload,
      )
      .subscribe({
        next: () => {
          console.log('Results posted successfully!');
        },
        error: (err) => alert('Failed to post results'),
      });
  }

  fetchResults() {
    this.http
      .get<any[]>(`${environment.apiUrl}/api/lobby/${this.roomCode}/results`) // ENVIRONMENT SWAP
      .subscribe({
        next: (data) => {
          this.results = data;
        },
      });
  }

  // --- GETTERS FOR UI ---

  get isLocalPlayerHost(): boolean {
    // NULL-SAFE FIX: Added '?' here as well
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
        `${environment.apiUrl}/api/lobby/${this.roomCode}/unsubmit?nickname=${this.localNickname}`, // ENVIRONMENT SWAP
        {},
      )
      .subscribe({
        next: () => {
          this.hasSubmitted = false;
          this.fetchData(); // Instantly update the radar so the Host knows you aren't ready!
        },
        error: (err) => {
          console.error('Could not edit picks', err);
          alert('Error trying to edit picks.');
        },
      });
  }

  fetchAllPicks() {
    this.http
      .get<any>(`${environment.apiUrl}/api/lobby/${this.roomCode}/all-picks`) // ENVIRONMENT SWAP
      .subscribe({
        next: (data) => {
          // Convert the Java Map {"Rishy": ["CSK", "MI"]} into an Angular Array
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
        `${environment.apiUrl}/api/lobby/${this.roomCode}/reveal-consensus`, // ENVIRONMENT SWAP
        {},
      )
      .subscribe({
        next: () => console.log('Democracy has spoken!'),
        error: (err) => console.error('Reveal failed', err),
      });
  }
}