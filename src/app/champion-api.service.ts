import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, catchError, map, of, share, switchMap } from 'rxjs';

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

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

@Injectable({ providedIn: 'root' })
export class ChampionApiService {
  private readonly http = inject(HttpClient);

  private readonly champions$: Observable<RemoteChampion[]> = this.http.get<string[]>(VERSIONS_URL).pipe(
    switchMap(versions => {
      const latest = versions[0];
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
}
