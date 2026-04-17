import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'champion/:id',
    loadComponent: () =>
      import('./champion-details/champion-details.component').then(
        m => m.ChampionDetailsComponent
      ),
  },
];
