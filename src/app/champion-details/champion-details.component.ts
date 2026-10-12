import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';
import { ChampionService } from '../champion.service';
import { ChampionApiService } from '../champion-api.service';

@Component({
  selector: 'app-champion-details',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './champion-details.component.html',
  styleUrl: './champion-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampionDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly championService = inject(ChampionService);
  private readonly championApi = inject(ChampionApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map(params => Number(params.get('id'))))
  );

  readonly champion = computed(() => {
    const id = this.id();
    return id != null ? this.championService.getById(id) : undefined;
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

  get championImageUrl(): string {
    const name = this.champion()?.name?.trim() ?? '';
    return `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${name}.png`;
  }
}
