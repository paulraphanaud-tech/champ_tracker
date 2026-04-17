import { Injectable, inject } from '@angular/core';
import { ChampionService } from '../champion.service';

@Injectable()
export class DashboardPresenter {
  private readonly championService = inject(ChampionService);

  readonly champions = this.championService.champions;

  toggleFavorite(id: number): void {
    this.championService.toggleFavorite(id);
  }
}
