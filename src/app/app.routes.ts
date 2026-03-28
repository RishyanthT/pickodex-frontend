import { Routes } from '@angular/router';
import { LobbyComponent } from './components/lobby/lobby.component';
import { WaitingRoomComponent } from './components/waiting-room/waiting-room.component';
import { SetupComponent } from './components/setup/setup.component';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'setup', component: SetupComponent }, // The new Wizard
  { path: 'waiting-room/:code', component: WaitingRoomComponent },
];