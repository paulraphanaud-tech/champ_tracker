import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChampionCardComponent } from '../champion-card/champion-card.component';
import { DashboardPresenter } from './dashboard.presenter';

@Component({
  selector: 'app-dashboard',
  imports: [ChampionCardComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardPresenter],
})
export class DashboardComponent {
  readonly presenter = inject(DashboardPresenter);
}
