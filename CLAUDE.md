# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
ng serve          # Dev server at http://localhost:4200
ng build          # Production build → dist/champ_tracker/
ng build --watch --configuration development  # Watch mode
ng test           # Run tests with Karma/Jasmine
ng test --include='**/foo.component.spec.ts'  # Run a single test file
```

No lint script is configured. The project uses Angular CLI (`ng`) for all tasks.

## Architecture

Angular 19 standalone app — no NgModules anywhere. All components use `ChangeDetectionStrategy.OnPush`.

**State management:** `ChampionService` holds a single `signal<Champion[]>` as the source of truth. All state mutations go through service methods (currently in-memory only, no backend).

**Presenter pattern:** Smart components delegate business logic to a co-located presenter class (e.g., `DashboardPresenter`). The presenter is provided locally (`providers: [DashboardPresenter]` on the component) so it's scoped to that component subtree. The component template binds exclusively through `this.presenter`.

**Routing:** Two routes — dashboard (eager) and `champion/:id` (lazy via `loadComponent`). The details page converts the route param Observable to a signal with `toSignal()`, then derives the champion with `computed()`.

**Component contracts:** Presentational components use Angular 17+ `input.required<T>()` and `output<T>()` APIs — not `@Input()`/`@Output()` decorators. Templates use control flow syntax (`@for`, `@if`).

**Champion images** are fetched from the League of Legends Data Dragon CDN at runtime — no local assets.

## Key Files

| File | Role |
|------|------|
| `src/app/champion.ts` | `Champion` interface + `ChampionRole`/`ChampionLane` enums |
| `src/app/champion.service.ts` | Root-scoped service, signal state, all mutations |
| `src/app/app.routes.ts` | Route definitions |
| `src/app/dashboard/dashboard.presenter.ts` | Dashboard business logic (local provider) |
| `src/app/champion-details/champion-details.component.ts` | `toSignal` + `computed` pattern for route params |
