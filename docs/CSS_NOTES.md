# CSS — flex/grid, responsive, cascade et spécificité

## Flexbox vs Grid, et pourquoi les deux coexistent ici

- **Flexbox** est utilisé partout où on aligne des éléments **sur un seul axe** dont le
  nombre/la taille dépend du contenu : la barre d'outils du dashboard
  (`dashboard.component.scss` → `.dashboard__toolbar`, titre + champ de recherche), le
  header de la page détails (`champion-details.component.scss` → `.details__header`,
  image + titre), la carte de l'explorateur (`.explorer-card`, image + texte).
- **CSS Grid** est utilisé pour des **grilles à deux dimensions** dont on contrôle le
  nombre de colonnes : la liste de champions du dashboard (`.dashboard__grid`), la
  grille de l'explorateur (`.explorer__grid`), et le bloc méta de la page détails
  (`.details__meta`, rôle/lane/difficulté alignés en colonnes sur desktop).

Un même composant combine souvent les deux : `.details__card` a un header en flex et
un bloc de métadonnées en grid — flex pour aligner deux blocs de tailles différentes,
grid pour aligner trois valeurs comparables en colonnes.

## Responsive : `min-width` vs `max-width`

- **Mobile-first (`min-width`)**, utilisé dans `dashboard.component.scss` et
  `champion-details.component.scss` : le style de base cible le plus petit écran, puis
  chaque `@media (min-width: …)` ajoute de la complexité au fur et à mesure que l'écran
  grandit.
  ```scss
  .dashboard__grid {
    grid-template-columns: 1fr;              // < 480px : une colonne
    @media (min-width: 480px) { … }          // >= 480px : deux colonnes
    @media (min-width: 900px) { … }          // >= 900px : auto-fit
  }
  ```
- **`max-width` en contrainte de largeur** (pas en breakpoint ici) : `.details`
  utilise `max-width: 640px; margin: 0 auto;` pour empêcher la colonne de texte de
  s'étirer sur un très grand écran — une largeur de lecture confortable reste la même
  quelle que soit la largeur de la fenêtre.

## Ordre de spécificité et de cascade

Rappel de l'ordre de spécificité CSS (du plus fort au plus faible) :

1. `style="…"` inline
2. sélecteurs d'ID (`#foo`)
3. classes, attributs, pseudo-classes (`.foo`, `[type=…]`, `:hover`)
4. éléments et pseudo-éléments (`div`, `::before`)

Ce projet n'utilise (volontairement) que des classes (BEM-like : `.champion-card`,
`.champion-card__image`, `.champion-card--active`), jamais d'ID ni de style inline —
tous les sélecteurs sont donc au même niveau de spécificité (3), et c'est **l'ordre
d'apparition dans la cascade** qui tranche en cas de conflit, pas la spécificité.

### La cascade entre fichiers dans une app Angular

Deux mécanismes se combinent ici :

1. **Ordre de chargement.** `src/styles.scss` est déclaré en premier dans
   `angular.json` (`architect.build.styles`) : c'est le style *global*, appliqué à
   tout le DOM. Les styles de composant (`*.component.scss`) sont injectés dans le
   document après, à l'exécution du composant.
2. **Encapsulation des vues (`ViewEncapsulation.Emulated`, le défaut Angular).**
   Angular réécrit chaque sélecteur de `*.component.scss` en lui ajoutant un attribut
   généré (`[_ngcontent-xyz]`), et pose ce même attribut sur les éléments du template
   du composant. Concrètement, `.champion-card { … }` devient
   `.champion-card[_ngcontent-xyz] { … }` — un sélecteur d'attribut ajoute de la
   spécificité (niveau 3, comme une classe). Un style global qui ciblerait
   `.champion-card` sans cet attribut a la **même** spécificité numérique, mais perd
   quand même en cas de collision car les styles de composant sont injectés dans le
   `<head>` *après* `styles.css` — à spécificité égale, le dernier déclaré gagne.

En pratique dans ce repo : les **custom properties** (`--color-bg`, `--space-4`,
etc.) définies sur `:root` dans `styles.scss` servent de couche de thème globale,
héritée par tous les composants (les variables CSS traversent l'encapsulation
Angular, contrairement aux sélecteurs de classe). Un composant peut toujours
redéfinir une variable sur son propre hôte pour un override local — ce n'est pas fait
ici, mais l'architecture le permettrait sans toucher au fichier global.

## Où regarder dans le code

- `src/styles.scss` — variables globales (couleurs, espacements, rayons), police
  système, cascade la plus basse priorité.
- `src/app/dashboard/dashboard.component.scss` — flex (toolbar) + grid responsive
  (`min-width` en 2 paliers).
- `src/app/champion-details/champion-details.component.scss` — flex (header) + grid
  (meta, `min-width: 480px`) + `max-width` de lecture.
- `src/app/explorer/champion-explorer.component.scss` — grid `auto-fill` pour une
  liste distante de taille variable.
