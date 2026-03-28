import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '@env/environment';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent {
  // --- Form Variables ---
  nickname: string = '';
  joinCode: string = '';
  userPin: string = ''; // New variable for the secret code
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /**
   * For the Host: Save identity and go to the Setup Wizard
   */

  enforcePinFormat(event: any) {
    // Replaces any non-digit character with nothing, and limits to 4 characters
    this.userPin = event.target.value.replace(/\D/g, '').substring(0, 4);
  }

  onCreateGame() {
    if (!this.nickname || !this.userPin) {
      alert('Please enter a Nickname and a Secret PIN to start!');
      return;
    }

    if (!/^\d{4}$/.test(this.userPin)) {
      alert('Your Secret PIN must be exactly 4 numbers!');
      return;
    }

    // Save identity so the Setup and Waiting Room know who the host is
    sessionStorage.setItem('nickname', this.nickname);
    sessionStorage.setItem('userPin', this.userPin);

    this.router.navigate(['/setup']);
  }

  /**
   * For the Guest: Validate PIN and Room Code with the Backend
   */
  onJoinGame() {
    if (!this.nickname || !this.joinCode || !this.userPin) {
      alert('Enter your Nickname, Room Code, AND your Secret PIN!');
      return;
    }

    if (!/^\d{4}$/.test(this.userPin)) {
      alert('Your Secret PIN must be exactly 4 numbers!');
      return;
    }

    this.isLoading = true;

    // THE ENVIRONMENT FIX: Swapped out localhost for the environment variable here!
    const url = `${environment.apiUrl}/api/lobby/join/${this.joinCode.toUpperCase()}`;

    // THE FIX: Send the data as a JSON Body so the backend's @RequestBody can read it!
    const payload = {
      nickname: this.nickname,
      pin: this.userPin,
    };

    this.http.post<any>(url, payload).subscribe({
      next: (room) => {
        this.isLoading = false;

        sessionStorage.setItem('nickname', this.nickname);
        sessionStorage.setItem('userPin', this.userPin);

        this.router.navigate(['/waiting-room', room.roomCode]);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          alert(err.error || 'Incorrect PIN for this nickname!');
        } else {
          alert('Room not found or server is down.');
        }
      },
    });
  }
}