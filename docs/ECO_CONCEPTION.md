# Éco-conception : RGESN, RWEB, et ce qui est appliqué ici

## Les deux référentiels

- **RGESN** (Référentiel Général d'Écoconception de Services Numériques) — publié par
  l'État français (mission écoconception des services numériques / Arcep / ADEME). Il
  couvre l'écoconception à l'échelle d'un *service* entier : stratégie produit,
  spécifications, architecture, UX/UI, contenus, frontend, backend, hébergement,
  algorithmie. C'est un référentiel d'entreprise/produit, pas seulement de code.
- **RWEB** (règles d'écoconception web, popularisées par le collectif GreenIT.fr,
  ~115 règles) — plus opérationnel et centré sur l'implémentation web : poids des
  pages, nombre de requêtes, optimisation d'images, minification, cache, accessibilité
  (un site accessible = moins d'interactions superflues pour y arriver), etc.

Les deux référentiels convergent sur un principe central : **la sobriété numérique
consiste à transférer le moins d'octets possible, exécuter le moins de calcul
possible, et solliciter le moins souvent possible le réseau et le CPU/GPU de
l'utilisateur** — pas à "optimiser" après coup, mais à faire des choix d'architecture
qui rendent le gaspillage impossible par construction.

## Ce qui est appliqué dans ce repo, concrètement

| Règle (RGESN / RWEB) | Mise en œuvre | Fichier |
|---|---|---|
| Charger uniquement le code nécessaire à la page courante | Lazy-loading des routes secondaires (`loadComponent`) : le JS de `/champion/:id` et `/explorer` n'est téléchargé que si l'utilisateur y navigue | `src/app/app.routes.ts` |
| Minimiser les recalculs / re-rendus inutiles | `ChangeDetectionStrategy.OnPush` sur tous les composants + `signal()`/`computed()` : Angular ne re-rend un composant que si une de ses entrées a réellement changé de référence, au lieu de tout revérifier à chaque event du DOM (voir la comparaison zone.js/signals ci-dessous) | tous les `*.component.ts` |
| Ne pas re-télécharger une donnée déjà obtenue | Cache HTTP applicatif via RxJS (`share()` + `ReplaySubject`) sur l'appel à l'API Data Dragon : un seul appel réseau pour toute la session, quel que soit le nombre de composants qui consultent la liste de champions | `src/app/champion-api.service.ts`, détaillé dans `docs/ASYNC_NOTES.md` |
| Poids et format des images | `NgOptimizedImage` (`ngSrc`), qui impose des dimensions explicites (évite le *layout shift*, donc des re-rendus de mise en page coûteux) et n'utilise `priority` que sur l'image réellement visible immédiatement (LCP) | `champion-card`, `champion-details`, `champion-explorer` |
| Pas de ressources tierces superflues | Aucune web font externe : pile de polices système (`-apple-system, …`) — zéro requête réseau pour le texte. Icônes en SVG inline (pas d'icon font entière chargée pour 2 glyphes) | `src/styles.scss`, `champion-details.component.html` |
| Pas de dépendance superflue | Aucun framework CSS (Bootstrap/Tailwind complet), aucune librairie de composants UI lourde — CSS écrit à la main, ~quelques Ko par composant | tout le repo |
| Budget de poids explicite et vérifié en CI | Budgets de build Angular (500 kB en avertissement, 1 MB en erreur pour le bundle initial) | `angular.json` |
| Mesurer plutôt que supposer | Lighthouse CI configuré avec des seuils sur performance/accessibilité/best-practices/SEO + poids total de page, exécutable en local ou en CI | `lighthouserc.json`, script `npm run lighthouse` |

## zone.js vs signals — la question de la réactivité

Angular a historiquement utilisé **zone.js** : une monkey-patch de toutes les API
asynchrones du navigateur (`setTimeout`, `addEventListener`, promesses, XHR…) qui
notifie Angular après *chaque* tâche async, quel que soit l'endroit du DOM concerné.
Angular réagit en relançant la détection de changement sur **tout l'arbre de
composants** (sauf s'ils sont `OnPush` et qu'aucune de leurs entrées n'a changé) — un
mécanisme large et générique, mais qui vérifie beaucoup de composants qui n'ont, en
réalité, pas changé.

Les **signals** (Angular 16+, utilisés dans tout ce repo — `ChampionService.champions`,
les `computed()` des presenters) inversent la logique : chaque signal sait précisément
qui dépend de lui. Quand `champions.set(...)` est appelé, seuls les `computed()` et
templates qui lisent effectivement ce signal sont invalidés et recalculés — pas besoin
de zone.js pour le déclenchement, ni de parcourir l'arbre entier pour vérifier "est-ce
que quelque chose a changé ici ?".

Ce repo est **entièrement zoneless** (`provideZonelessChangeDetection`,
voir `src/app/app.config.ts`) : zone.js n'est plus chargé, ni dans l'application ni
dans les tests (polyfills retirés d'`angular.json`). La détection de changement n'est
plus déclenchée par « n'importe quelle tâche async » mais uniquement par ce qui
concerne réellement l'UI : écriture d'un signal lu par un template, événement DOM lié
dans un template, changement d'`input()`. Tout l'état affiché passe donc par des
signals — y compris le paramètre de route `:id`, reçu comme `input()` grâce à
`withComponentInputBinding()`.

Gain mesuré (`ng build`, bundle initial) : **285 kB → 250 kB** bruts,
**80,4 kB → 68,9 kB** transférés (le chunk `polyfills` de zone.js disparaît).

`zone.js` reste listé dans `package.json` uniquement parce qu'Angular 19 le déclare
comme *peer dependency* obligatoire ; il pourra être retiré à partir d'Angular 20, où
il devient optionnel. Chaque `TestBed` déclare aussi
`provideZonelessChangeDetection()` pour tester dans les mêmes conditions
qu'en production.

## Aller plus loin

```bash
npm run lighthouse   # build de prod + audit Lighthouse local (3 runs, seuils dans lighthouserc.json)
```

Le rapport HTML est écrit dans `.lighthouseci/` (ignoré par git, généré à chaque run).
