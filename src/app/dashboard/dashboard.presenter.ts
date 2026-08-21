import { Injectable, computed, inject, signal } from '@angular/core';
import { ChampionService } from '../champion.service';

@Injectable()
export class DashboardPresenter {
  private readonly championService = inject(ChampionService);

  readonly searchQuery = signal('');

  readonly hasAnyChampion = computed(() => this.championService.champions().length > 0);

  readonly champions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.championService.champions();
    return query ? all.filter(c => c.name.toLowerCase().includes(query)) : all;
  });

  toggleFavorite(id: number): void {
    this.championService.toggleFavorite(id);
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value);
  }
}
