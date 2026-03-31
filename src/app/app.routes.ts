import { Routes } from '@angular/router';
import { LobbyComponent } from './components/lobby/lobby.component';
import { WaitingRoomComponent } from './components/waiting-room/waiting-room.component';
import { SetupComponent } from './components/setup/setup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'setup', component: SetupComponent },
  { path: 'waiting-room/:code', component: WaitingRoomComponent },
];