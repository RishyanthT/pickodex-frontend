import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  nickname: string | null = '';
  userPin: string | null = '';
  joinCode: string = '';
  isLoading: boolean = false;

  // New variables for our Active Rooms list
  activeRooms: any[] = [];
  isLoadingRooms: boolean = true;

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.nickname = localStorage.getItem('nickname');
    this.userPin = localStorage.getItem('userPin');

    if (!this.nickname || !this.userPin) {
      this.router.navigate(['/']);
    } else {
      // If they are logged in, fetch their games!
      this.fetchActiveRooms();
    }
  }

  fetchActiveRooms() {
    this.http
      .get<any[]>(`${environment.apiUrl}/api/lobby/user/${this.nickname}/rooms`)
      .subscribe({
        next: (rooms) => {
          this.activeRooms = rooms;
          this.isLoadingRooms = false;
        },
        error: (err) => {
          console.error('No active rooms found or backend not ready yet', err);
          this.isLoadingRooms = false;
        },
      });
  }

  rejoinRoom(roomCode: string) {
    this.router.navigate(['/waiting-room', roomCode]);
  }

  onChangeUser() {
    localStorage.removeItem('nickname');
    localStorage.removeItem('userPin');
    this.router.navigate(['/']);
  }

  onCreateGame() {
    this.router.navigate(['/setup']);
  }

  onLeaveRoom(roomCode: string, event: Event) {
    event.stopPropagation(); // Stops the click from triggering the rejoin

    if (
      confirm(
        'Are you sure you want to leave this room? Your picks will be deleted.',
      )
    ) {
      this.http
        .delete(
          `${environment.apiUrl}/api/lobby/${roomCode}/leave?nickname=${this.nickname}`,
        )
        .subscribe({
          next: () => {
            // Remove it from the screen instantly
            this.activeRooms = this.activeRooms.filter(
              (r) => r.roomCode !== roomCode,
            );
          },
          error: (err) => alert('Failed to leave room.'),
        });
    }
  }

  onJoinGame() {
    if (!this.joinCode) {
      alert('Please enter a Room Code!');
      return;
    }

    this.isLoading = true;
    const url = `${environment.apiUrl}/api/lobby/join/${this.joinCode.toUpperCase()}`;
    const payload = {
      nickname: this.nickname,
      pin: this.userPin,
    };

    this.http.post<any>(url, payload).subscribe({
      next: (room) => {
        this.isLoading = false;
        this.router.navigate(['/waiting-room', room.roomCode]);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          alert(err.error || 'Incorrect PIN for this nickname in this room!');
        } else {
          alert('Room not found or server is down.');
        }
      },
    });
  }
}
