import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'chat',
    loadComponent: () =>
      import('./chat/pages/chat-page/chat-page').then((m) => m.ChatPageComponent),
  },
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
];
