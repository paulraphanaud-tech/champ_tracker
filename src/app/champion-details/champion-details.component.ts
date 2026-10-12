import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { ChampionService } from '../champion.service';
import { ChampionApiService } from '../champion-api.service';
import { championImageUrl } from '../champion-image';

@Component({
  selector: 'app-champion-details',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './champion-details.component.html',
  styleUrl: './champion-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampionDetailsComponent {
  private readonly championService = inject(ChampionService);
  private readonly championApi = inject(ChampionApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** Paramètre `:id` de la route, injecté par withComponentInputBinding(). */
  readonly id = input<string>();

  readonly champion = computed(() => {
    const id = Number(this.id());
    return Number.isNaN(id) ? undefined : this.championService.getById(id);
  });

  readonly expanded = signal(false);
  readonly loreLoading = signal(false);
  private readonly lore = signal<string | null>(null);

  /** Texte affiché : le lore complet une fois la carte étendue, sinon le résumé stocké. */
  readonly description = computed(() => {
    const notes = this.champion()?.notes ?? '';
    return this.expanded() ? (this.lore() ?? notes) : notes;
  });

  toggleDescription(): void {
    const champ = this.champion();
    if (!champ) {
      return;
    }
    this.expanded.update(expanded => !expanded);
    if (this.expanded() && this.lore() === null && !this.loreLoading()) {
      this.loreLoading.set(true);
      this.championApi.getChampionLore(champ.name)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(lore => {
          this.lore.set(lore);
          this.loreLoading.set(false);
        });
    }
  }

  readonly championImageUrl = computed(() => championImageUrl(this.champion()?.name ?? ''));
}
