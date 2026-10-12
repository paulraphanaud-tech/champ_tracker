import { Injectable, effect, signal } from '@angular/core';
import { Champion, ChampionLane, ChampionRole } from './champion';
import { RemoteChampion } from './champion-api.service';

const STORAGE_KEY = 'champ-tracker.champions.v1';

const ROLE_TAG_MAP: Record<string, ChampionRole> = {
  Assassin: ChampionRole.Assassin,
  Fighter: ChampionRole.Fighter,
  Mage: ChampionRole.Mage,
  Marksman: ChampionRole.Marksman,
  Support: ChampionRole.Support,
  Tank: ChampionRole.Tank,
};

function loadPersistedChampions(): Champion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Champion[]) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class ChampionService {
  readonly champions = signal<Champion[]>(loadPersistedChampions());

  constructor() {
    // Cache local : on réécrit la liste suivie à chaque changement pour la
    // retrouver telle quelle après un refresh de page.
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.champions()));
      } catch {
        // Stockage indisponible (navigation privée, quota dépassé…) : on continue en mémoire seule.
      }
    });
  }

  getById(id: number): Champion | undefined {
    return this.champions().find(c => c.id === id);
  }

  isTracked(name: string): boolean {
    return this.champions().some(c => c.name === name);
  }

  addChampion(remote: RemoteChampion): void {
    if (this.isTracked(remote.name)) {
      return;
    }
    const nextId = this.champions().reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const role = ROLE_TAG_MAP[remote.tags[0]] ?? ChampionRole.Fighter;
    this.champions.update(list => [
      ...list,
      {
        id: nextId,
        name: remote.name,
        role,
        lane: ChampionLane.Top,
        difficulty: 3,
        notes: remote.blurb,
      },
    ]);
  }

  removeChampion(remote: RemoteChampion): void {
    this.champions.update(list => list.filter(c => c.name !== remote.name));
  }
}
