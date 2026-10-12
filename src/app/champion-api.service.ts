import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, catchError, map, of, share, switchMap, take } from 'rxjs';

export interface RemoteChampion {
  id: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  imageUrl: string;
}

interface DataDragonChampionEntry {
  id: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  image: { full: string };
}

interface DataDragonChampionResponse {
  data: Record<string, DataDragonChampionEntry>;
}

interface DataDragonChampionDetailResponse {
  data: Record<string, { lore: string }>;
}

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

@Injectable({ providedIn: 'root' })
export class ChampionApiService {
  private readonly http = inject(HttpClient);

  private readonly latestVersion$: Observable<string> = this.http.get<string[]>(VERSIONS_URL).pipe(
    map(versions => versions[0]),
    share({
      connector: () => new ReplaySubject(1),
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: true,
    })
  );

  private readonly champions$: Observable<RemoteChampion[]> = this.latestVersion$.pipe(
    switchMap(latest => {
      return this.http.get<DataDragonChampionResponse>(
        `https://ddragon.leagueoflegends.com/cdn/${latest}/data/fr_FR/champion.json`
      ).pipe(
        map(response => Object.values(response.data)
          .map(entry => this.toRemoteChampion(entry, latest))
          .sort((a, b) => a.name.localeCompare(b.name))
        )
      );
    }),
    catchError(() => of<RemoteChampion[]>([])),
    // On utilise share() (et pas shareReplay()) pour pouvoir passer resetOnComplete: false.
    // Par défaut, shareReplay() réinitialise son buffer dès que la source se termine (ce qui
    // arrive tout de suite avec un GET HttpClient, qui complète après une seule émission).
    // Sans ce flag, chaque nouvel abonné après le premier déclencherait un nouvel appel
    // réseau au lieu de réutiliser le cache — l'inverse de ce qu'on veut pour l'éco-conception.
    share({
      connector: () => new ReplaySubject(1),
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: true,
    })
  );

  private toRemoteChampion(entry: DataDragonChampionEntry, version: string): RemoteChampion {
    return {
      id: entry.id,
      name: entry.name,
      title: entry.title,
      blurb: entry.blurb,
      tags: entry.tags,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${entry.image.full}`,
    };
  }

  getAllChampions(): Observable<RemoteChampion[]> {
    return this.champions$;
  }

  /**
   * Description complète (lore) d'un champion, retrouvé par son nom affiché.
   * Le blurb de champion.json est tronqué par Riot ; le lore n'existe que dans le
   * fichier par champion, qu'on ne télécharge qu'à la demande.
   * Émet null si le champion est inconnu ou si l'appel échoue.
   */
  getChampionLore(name: string): Observable<string | null> {
    return this.champions$.pipe(
      take(1),
      map(champions => champions.find(c => c.name === name)),
      switchMap(champion => {
        if (!champion) {
          return of(null);
        }
        return this.latestVersion$.pipe(
          take(1),
          switchMap(version => this.http.get<DataDragonChampionDetailResponse>(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion/${champion.id}.json`
          )),
          map(response => response.data[champion.id]?.lore ?? null)
        );
      }),
      catchError(() => of(null))
    );
  }
}
