import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '@env/environment';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
})
export class SetupComponent implements OnInit {
  // Wizard state (Start at 2 if nickname exists)
  step: number = 2;
  nickname: string = '';
  selectedMode: string = 'PREDICTION';

  // Existing Topics
  predictionTopics: string[] = [
    'IPL',
    'NFL_AFC',
    'NFL_NFC',
    'NBA_EAST',
    'NBA_WEST',
    'MLB_AL',
    'MLB_NL',
    'EPL',
    'LA_LIGA',
    'UCL',
  ];
  friendsTopics: string[] = ['GAMES', 'MOVIES', 'SERIES'];

  // Custom List State
  customTopic: string = '';
  itemCount: number = 5;
  customInputs: string[] = ['', '', '', '', ''];
  customPlayMode: string = 'FRIENDS_CHOICE'; // Default for custom lists

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // THE FIX: Switch to localStorage
    const savedName = localStorage.getItem('nickname');
    if (savedName) {
      this.nickname = savedName;
    } else {
      this.router.navigate(['/']);
    }
  }

  // Resizes the input array without deleting what you've already typed
  onCountChange(): void {
    const current = [...this.customInputs];
    this.customInputs = Array.from(
      { length: this.itemCount },
      (_, i) => current[i] || '',
    );
  }

  // Keeps focus on the correct input box when typing
  trackByFn(index: any): any {
    return index;
  }

  createGame(topic: string): void {
    // THE FIX: Switch to localStorage
    const pin = localStorage.getItem('userPin');

    if (!this.nickname || !pin) {
      alert('Session expired. Please restart from the lobby.');
      return;
    }

    // If the host clicked "Change Name" in Step 1, save the new name permanently!
    localStorage.setItem('nickname', this.nickname);

    // Determine if we are in the custom flow
    const isCustom = topic === 'CUSTOM';

    const payload = {
      nickname: this.nickname,
      topic: isCustom ? this.customTopic : topic,
      gameMode: isCustom ? this.customPlayMode : this.selectedMode,
      pin: pin,
      // Send the filtered inputs ONLY if it is a custom game
      customItems: isCustom
        ? this.customInputs.filter((val) => val.trim() !== '')
        : [],
    };

    this.http
      .post(`${environment.apiUrl}/api/lobby/create`, payload)
      .subscribe({
        next: (data: any) => {
          this.router.navigate(['/waiting-room', data.roomCode]);
        },
        error: (err) => alert('Room Creation Failed!'),
      });
  }
}