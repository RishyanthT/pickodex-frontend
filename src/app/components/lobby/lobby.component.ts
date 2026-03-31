import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent implements OnInit {
  nickname: string = '';
  userPin: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // 1. Check for new permanent storage
    let savedNickname = localStorage.getItem('nickname');
    let savedPin = localStorage.getItem('userPin');

    // 2. The Rescue Mission: Check if they are a legacy Beta 1.0 player
    if (!savedNickname || !savedPin) {
      savedNickname = sessionStorage.getItem('nickname');
      savedPin = sessionStorage.getItem('userPin');

      // If we found legacy data, upgrade it to permanent storage invisibly!
      if (savedNickname && savedPin) {
        localStorage.setItem('nickname', savedNickname);
        localStorage.setItem('userPin', savedPin);
      }
    }

    // 3. If we know who they are, skip this screen completely!
    if (savedNickname && savedPin) {
      this.router.navigate(['/dashboard']);
    }
  }

  enforcePinFormat(event: any) {
    this.userPin = event.target.value.replace(/\D/g, '').substring(0, 4);
  }

  onLogin() {
    if (!this.nickname || !this.userPin) {
      alert('Please enter a Nickname and a Secret PIN to start!');
      return;
    }

    if (!/^\d{4}$/.test(this.userPin)) {
      alert('Your Secret PIN must be exactly 4 numbers!');
      return;
    }

    // Save permanently for Beta 1.1
    localStorage.setItem('nickname', this.nickname);
    localStorage.setItem('userPin', this.userPin);

    // Send them to the new Hub
    this.router.navigate(['/dashboard']);
  }
}