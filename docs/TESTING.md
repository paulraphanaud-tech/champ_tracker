# La pyramide de test — appliquée à Champ Tracker

## Le principe

La pyramide de test classe les tests par **portée** (combien d'unités du système ils
mettent en jeu) et par **coût** (vitesse, fragilité, facilité de debug) :

```
        ▲
       /e2e\        peu nombreux, lents, fragiles, testent un parcours utilisateur complet
      /------\
     / integ. \     un peu plus nombreux, testent la collaboration entre 2+ unités
    /----------\
   /   unit.    \   très nombreux, rapides, isolés, testent une seule unité
  /--------------\
```

Plus on monte, plus un test en dit long sur le comportement réel perçu par
l'utilisateur — mais plus il est lent et coûteux à maintenir (un changement de détail
d'implémentation peut le casser sans qu'il y ait de vraie régression). Plus on descend,
plus le test est rapide et précis pour localiser un bug — mais il ne garantit rien sur
l'intégration des pièces entre elles. D'où la forme pyramidale : beaucoup de tests
unitaires bon marché à la base, un nombre raisonnable de tests d'intégration/composants
au milieu, et très peu (voire zéro) d'e2e au sommet.

Ce repo n'a pas d'outil e2e configuré (Cypress/Playwright) : l'application est petite,
sans backend réel, et les parcours critiques (afficher un champion, consulter sa
page détails, l'ajouter depuis l'explorateur) sont déjà couverts en intégration ci-dessous.
Ajouter un vrai navigateur piloté pour ça serait un coût qui ne changerait pas la
confiance qu'on a dans le code.

## Ce qui est testé, et à quel étage

### Unitaire — une seule unité, dépendances mockées ou absentes

| Fichier | Ce qu'il isole |
|---|---|
| `src/app/champion.service.spec.ts` | La logique pure de `ChampionService` (`getById`, `isTracked`, `addChampion`, `removeChampion`), y compris la persistance dans `localStorage` (le service se réhydrate à l'identique dans une nouvelle instance, simulant un refresh de page), sans aucun rendu DOM. |
| `src/app/champion-api.service.spec.ts` | `ChampionApiService` avec `HttpTestingController` : le vrai réseau est remplacé par des réponses simulées. Vérifie le mapping de la réponse Data Dragon **et** le comportement de cache (`share()` + `ReplaySubject`) — un deuxième abonné ne redéclenche pas d'appel HTTP. |
| `src/app/dashboard/dashboard.presenter.spec.ts` | `DashboardPresenter` avec un `ChampionService` **mocké** (spy) : vérifie l'exposition des champions (`hasAnyChampion`) et le filtrage de recherche en isolation, sans dépendre du vrai service ni du DOM. |

### Intégration / composants — plusieurs unités connectées, rendu réel (TestBed)

| Fichier | Ce qu'il connecte |
|---|---|
| `src/app/champion-card/champion-card.component.spec.ts` | `ChampionCardComponent` + `RouterLink` (avec un routeur réel non-navigant) : vérifie le rendu DOM du nom, du rôle, de la lane et de la difficulté à partir de l'input `champion`. |
| `src/app/dashboard/dashboard.component.spec.ts` | **Intégration complète** : `DashboardComponent` + `DashboardPresenter` + `ChampionCardComponent` + le **vrai** `ChampionService` (non mocké). Vérifie l'état vide (message + lien vers l'explorateur) et qu'une carte est rendue par champion suivi dans le service — exactement le chemin emprunté en production. |
| `src/app/champion-details/champion-details.component.spec.ts` | `ChampionDetailsComponent` + le **vrai** `ChampionService`. L'`id` est passé via `fixture.componentRef.setInput('id', …)`, comme le ferait le routeur ; un test supplémentaire navigue avec `RouterTestingHarness` sur la vraie config (`appConfig`) pour vérifier que `withComponentInputBinding()` transmet bien `:id`. Vérifie la résolution du champion, l'état « introuvable » et le chargement paresseux du lore. |
| `src/app/explorer/champion-explorer.component.spec.ts` | `ChampionExplorerComponent` + `ExplorerPresenter` + le **vrai** `ChampionService`, avec `HttpTestingController` pour simuler l'API Data Dragon. Vérifie le toggle suivre/ne plus suivre de bout en bout : clic DOM → `ChampionService.addChampion`/`removeChampion` → texte du bouton mis à jour. |

## Pourquoi ce découpage

- Les tests unitaires vérifient qu'**une pièce fait ce qu'elle promet** isolément — ils
  sont rapides (quelques ms), donc on peut en avoir beaucoup sans ralentir la boucle de
  feedback.
- Les tests d'intégration vérifient que **les pièces s'assemblent correctement** — en
  particulier que l'état partagé via `ChampionService` (signal unique, source de
  vérité) se propage bien entre presenter, composants enfants et composants soeurs
  (dashboard ↔ détails). C'est le niveau le plus rentable ici : peu de tests, mais qui
  couvrent le pattern architectural central du projet (voir `CLAUDE.md` — presenter +
  service signal).
- Pas d'e2e : le rapport effort/confiance ne le justifie pas pour une appli de cette
  taille sans backend.

**Pièges à connaître :**
- `ChampionService` persiste désormais dans `localStorage`, qui est un état
  **partagé entre tous les tests d'un même fichier de spec** (Vitest isole chaque
  fichier dans son propre environnement jsdom, mais pas les tests entre eux). Chaque
  test qui touche `ChampionService` fait donc
  `localStorage.clear()` en `beforeEach`/`afterEach` pour rester isolé — sans ça, un
  champion suivi dans un test polluerait les suivants.
- La persistance elle-même est écrite via `effect()` (voir `champion.service.ts`),
  qui n'est **pas synchrone** : il est planifié plutôt qu'exécuté immédiatement après
  le `signal.update()`. Un test qui vérifie le contenu de `localStorage` juste après
  une mutation doit d'abord appeler `TestBed.tick()`, sans quoi il lit l'état
  d'avant l'écriture.

## Lancer les tests

```bash
ng test                                          # mode watch
ng test --watch=false                            # une passe, CI-friendly
ng test --include='**/champion.service.spec.ts'  # un seul fichier
```
