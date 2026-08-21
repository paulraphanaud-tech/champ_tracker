# Asynchronisme — l'appel API et son intégration avec les signals

## L'API publique utilisée

[Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon), le CDN public de
données statiques de League of Legends, sans clé ni authentification, CORS ouvert :

1. `GET https://ddragon.leagueoflegends.com/api/versions.json` → liste des versions,
   la première étant la plus récente.
2. `GET https://ddragon.leagueoflegends.com/cdn/{version}/data/fr_FR/champion.json` →
   la liste complète des champions (nom, titre, tags de rôle, résumé, image).

Ces deux appels sont chaînés dans `src/app/champion-api.service.ts`.

## Observable vs Promise

Une `Promise` représente **une valeur future unique**, calculée dès sa création
(*eager*) : `fetch(url)` part immédiatement, que quelqu'un fasse `.then()` ou non. Un
`Observable` RxJS est **paresseux** (*lazy* / "cold") : `http.get(url)` ne fait
strictement rien tant que personne ne s'y abonne (`.subscribe()`). C'est pour ça que
`champions$` peut être défini comme propriété de classe sans déclencher d'appel réseau
au démarrage de l'application — seul `getAllChampions().subscribe(...)` (fait par
`ExplorerPresenter` via `toSignal`) déclenche réellement la requête.

Un Observable peut aussi émettre **plusieurs** valeurs dans le temps (utile pour du
WebSocket, un `valueChanges` de formulaire, etc.), alors qu'une Promise se résout une
seule fois. Ici, la réponse HTTP est un flux qui émet une seule valeur puis se
termine — proche d'une Promise dans son comportement, mais on garde l'avantage de la
composition d'opérateurs RxJS (voir ci-dessous), qui serait beaucoup plus verbeuse en
`async`/`await` pur.

## Les opérateurs utilisés, et pourquoi

```ts
this.http.get<string[]>(VERSIONS_URL).pipe(
  switchMap(versions => this.http.get<...>(`.../${versions[0]}/...`).pipe(map(...))),
  catchError(() => of([])),
  share({ connector: () => new ReplaySubject(1), resetOnComplete: false, ... })
);
```

- **`switchMap`** : enchaîne le deuxième appel HTTP (liste des champions) une fois la
  version connue, en aplatissant l'Observable interne. Si une nouvelle requête devait
  partir avant que la précédente ne soit terminée, `switchMap` annulerait
  automatiquement la précédente — utile pour éviter des réponses obsolètes (ex. une
  barre de recherche qui relance une requête à chaque frappe).
- **`catchError`** : intercepte une erreur réseau (API indisponible, CORS, etc.) et la
  transforme en une valeur de repli (`of([])`) plutôt que de laisser l'erreur se
  propager et casser l'abonnement. Le composant reçoit donc toujours un tableau,
  jamais une exception à rattraper manuellement dans le template.
- **`share()` avec un `ReplaySubject(1)` et `resetOnComplete: false`** : c'est le
  mécanisme de **cache** (voir aussi le principe de performance dans
  `docs/ECO_CONCEPTION.md`). Sans ça, chaque composant qui s'abonne à
  `getAllChampions()` redéclencherait les deux appels HTTP. `resetOnComplete: false`
  est nécessaire car `shareReplay()` seul réinitialiserait son buffer dès que la
  requête se termine (ce qui arrive tout de suite avec un `HttpClient.get`, qui
  complète après une seule émission) — piège classique de RxJS 7, documenté et testé
  dans `champion-api.service.spec.ts` (« un deuxième abonné ne déclenche pas de
  nouvel appel réseau »).

## Interop avec les signals : `toSignal`

Angular signals sont **pull-based** (synchrones, on lit `.()` quand on veut) alors que
RxJS est **push-based** (asynchrone, on réagit à ce qui arrive). `toSignal()` fait le
pont : il s'abonne à l'Observable et republie chaque émission comme la valeur d'un
signal, en gérant automatiquement le désabonnement à la destruction du composant.

Dans `src/app/explorer/explorer.presenter.ts` :

```ts
private readonly loadState = toSignal(
  this.championApi.getAllChampions().pipe(map(champions => ({ champions, loading: false }))),
  { initialValue: { champions: [], loading: true } }
);

readonly champions = computed(() => this.loadState().champions);
readonly loading = computed(() => this.loadState().loading);
```

`initialValue` fournit une valeur synchrone disponible dès le premier rendu (avant
que la réponse HTTP n'arrive) — c'est ce qui permet au template d'afficher un état de
chargement sans `| async` ni gestion manuelle d'abonnement/désabonnement. Une fois la
réponse arrivée, le signal se met à jour et Angular ré-exécute uniquement les
`computed()` qui en dépendent (voir aussi la comparaison zone.js/signals dans
`docs/ECO_CONCEPTION.md`).

## Gestion des états loading / erreur / succès

Le template (`champion-explorer.component.html`) bascule entre trois états dérivés
du même signal, sans variable de composant supplémentaire à synchroniser :

```html
@if (presenter.loading()) { … }
@else if (presenter.error()) { … }
@else { <!-- liste des champions --> }
```

`error` est un `computed()` dérivé (`!loading() && champions().length === 0`) plutôt
qu'un signal indépendant : comme `catchError` normalise déjà une erreur réseau en
liste vide, il n'y a pas de distinction structurelle entre "erreur" et "réponse vide"
à ce niveau — un compromis assumé pour cette taille de projet plutôt que de faire
remonter un état d'erreur distinct depuis le service.
