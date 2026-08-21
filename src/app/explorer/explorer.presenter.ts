import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ChampionApiService, RemoteChampion } from '../champion-api.service';
import { ChampionService } from '../champion.service';

interface LoadState {
  champions: RemoteChampion[];
  loading: boolean;
}

@Injectable()
export class ExplorerPresenter {
  private readonly championApi = inject(ChampionApiService);
  private readonly championService = inject(ChampionService);

  private readonly loadState = toSignal(
    this.championApi.getAllChampions().pipe(map(champions => ({ champions, loading: false }))),
    { initialValue: { champions: [], loading: true } as LoadState }
  );

  readonly champions = computed(() => this.loadState().champions);
  readonly loading = computed(() => this.loadState().loading);
  // catchError() dans ChampionApiService ramène une erreur réseau à une liste vide :
  // une liste vide une fois le chargement terminé est donc traitée comme une erreur ici.
  readonly error = computed(() => !this.loading() && this.champions().length === 0);

  isTracked(name: string): boolean {
    return this.championService.isTracked(name);
  }

  track(remote: RemoteChampion): void {
    this.championService.addChampion(remote);
  }

  untrack(remote: RemoteChampion): void {
    this.championService.removeChampion(remote);
  }
}
