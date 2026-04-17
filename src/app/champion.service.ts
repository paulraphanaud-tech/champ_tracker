import { Injectable, signal } from '@angular/core';
import { Champion, ChampionLane, ChampionRole } from './champion';

@Injectable({ providedIn: 'root' })
export class ChampionService {
  readonly champions = signal<Champion[]>([
    {
      id: 1,
      name: 'Ahri',
      role: ChampionRole.Mage,
      lane: ChampionLane.Mid,
      difficulty: 3,
      isFavorite: true,
      notes: 'Roam après le niveau 6, chercher des charms sur les carries.',
    },
    {
      id: 2,
      name: 'Lee Sin',
      role: ChampionRole.Fighter,
      lane: ChampionLane.Jungle,
      difficulty: 5,
      isFavorite: false,
      notes: 'Fort early game, chercher les ganks niveau 3.',
    },
    {
      id: 3,
      name: 'Thresh',
      role: ChampionRole.Support,
      lane: ChampionLane.Bot,
      difficulty: 4,
      isFavorite: true,
      notes: "Hook depuis le fog, protéger l'ADC avec la lanterne.",
    },
  ]);

  getById(id: number): Champion | undefined {
    return this.champions().find(c => c.id === id);
  }

  toggleFavorite(id: number): void {
    this.champions.update(list =>
      list.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  }
}
