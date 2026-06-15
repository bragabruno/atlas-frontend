import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'chat',
    loadComponent: () =>
      import('./chat/pages/chat-page/chat-page').then((m) => m.ChatPageComponent),
  },
  {
    path: 'usage',
    loadComponent: () =>
      import('./usage/components/cost-dashboard/cost-dashboard').then(
        (m) => m.CostDashboardComponent,
      ),
  },
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
];
