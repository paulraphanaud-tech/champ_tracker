---
name: commit
description: Commit les changements en cours sous forme de commits atomiques au format gitmoji (shortcode `:emoji:` + message en français). Use when the user asks to commit, "fais les commits", "commit en gitmoji", or wants the working tree split into atomic commits.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git restore:*), Bash(git reset:*), Bash(git commit:*), Bash(git apply:*), Bash(ng test:*), Bash(ng build:*), Read
---

# Commits atomiques en gitmoji

Transforme les changements en cours en une série de commits **atomiques** : chaque commit fait **une seule chose**, compile, et peut être relu ou revert indépendamment.

## 1. Analyser l'état du dépôt

Lancer en parallèle :

```bash
git status --short
git diff              # non indexé
git diff --staged     # déjà indexé
git log --format='%s' -10   # rappel du style existant
```

- Si rien n'est à commiter, le dire et s'arrêter.
- Si des fichiers sont **déjà indexés**, les considérer comme un choix de l'utilisateur : les commiter tels quels en premier (après vérification qu'ils forment un tout cohérent), sinon demander.
- Ne jamais commiter de secrets (`.env`, clés, tokens) : les signaler et les exclure.

## 2. Découper en unités logiques

Lire chaque diff et regrouper les hunks par **intention**, pas par fichier :

- Une fonctionnalité + ses tests + son style = **un** commit (`:sparkles:`), sauf si les tests/le style ont une valeur propre.
- Un refactor sans changement de comportement est **séparé** d'un changement de comportement.
- Un fix découvert en route est **séparé** de la feature.
- Le formatage / renommage pur est **séparé** du reste.
- La CI, la config, la doc vont dans leurs propres commits.

Si un même fichier contient des changements de plusieurs unités, indexer seulement les hunks concernés :

```bash
git diff <fichier> > /tmp/…   # puis éditer le patch pour ne garder que les hunks voulus
git apply --cached <patch>
```

(`git add -p` est interactif et indisponible ici : passer par `git apply --cached`.)

Présenter le plan à l'utilisateur avant de commiter :

```
1. :bug: Correction du cache de l'API champions        → src/app/champion-api.service.ts (+ spec)
2. :lipstick: Mise en forme de la page détails       → champion-details.component.{html,scss}
3. :construction_worker: Ajout du job lint en CI       → .github/workflows/ci.yml
```

Attendre la validation si le découpage est ambigu ; sinon enchaîner.

## 3. Format du message

```
:shortcode: Résumé à l'impératif nominal, en français, ≤ 72 caractères

Corps optionnel (wrap à 72 col) : le POURQUOI et les détails non
évidents — pas la paraphrase du diff.

Co-Authored-By: …   (si une ligne d'attribution est requise par le contexte)
```

Règles :
- **Shortcode** (`:sparkles:`), jamais l'emoji unicode — c'est la convention du dépôt.
- Sujet en français, majuscule initiale, pas de point final (ex. « Ajout de… », « Correction de… », « Suppression de… »).
- Corps seulement s'il apporte du contexte (choix technique, piège évité, impact).
- Passer le message via heredoc :

```bash
git commit -m "$(cat <<'EOF'
:bug: Correction du cache de l'API champions

shareReplay() réinitialisait son buffer à la complétion du GET.

Co-Authored-By: …
EOF
)"
```

## 4. Choisir le gitmoji

| Shortcode | Usage |
|---|---|
| `:sparkles:` | Nouvelle fonctionnalité |
| `:bug:` | Correction de bug |
| `:ambulance:` | Hotfix critique |
| `:recycle:` | Refactor sans changement de comportement |
| `:art:` | Structure / format du code |
| `:lipstick:` | UI et styles (CSS/SCSS, templates purement visuels) |
| `:wheelchair:` | Accessibilité |
| `:zap:` | Performance |
| `:white_check_mark:` | Ajout / mise à jour de tests |
| `:memo:` | Documentation |
| `:fire:` | Suppression de code ou de fichiers |
| `:construction_worker:` | CI (GitHub Actions, buildspec…) |
| `:wrench:` | Fichiers de configuration |
| `:heavy_plus_sign:` / `:heavy_minus_sign:` | Ajout / retrait de dépendance |
| `:arrow_up:` / `:arrow_down:` | Montée / descente de version de dépendance |
| `:truck:` | Déplacement / renommage de fichiers |
| `:label:` | Types TypeScript |
| `:globe_with_meridians:` | Internationalisation |
| `:seedling:` | Données de seed / fixtures |
| `:see_no_evil:` | .gitignore |
| `:rotating_light:` | Correction de warnings lint/compilateur |
| `:pencil2:` | Coquille |
| `:rewind:` | Revert |
| `:tada:` | Commit initial |

Choisir l'emoji de l'**intention principale**. En cas de doute, préférer le plus spécifique (`:wheelchair:` plutôt que `:lipstick:` pour un contraste).

## 5. Exécuter

Pour chaque unité, dans l'ordre (dépendances d'abord : types/services avant les composants qui les utilisent) :

1. `git add <fichiers>` ou `git apply --cached <patch>` — jamais `git add -A` / `git add .` à l'aveugle.
2. `git diff --staged --stat` pour vérifier que l'index contient exactement l'unité.
3. `git commit` avec le message.

Ne jamais : `--amend` un commit existant, `--no-verify`, `push`, ni réécrire l'historique, sauf demande explicite. Si un hook pre-commit échoue, corriger le problème et créer un **nouveau** commit.

## 6. Conclure

Afficher le résultat :

```bash
git log --oneline -<n>
git status --short
```

et résumer en une ligne par commit. Signaler tout fichier volontairement laissé hors commit.
