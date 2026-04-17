import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';
import { ChampionService } from '../champion.service';
import { FavButtonComponent } from '../fav-button/fav-button.component';

@Component({
  selector: 'app-champion-details',
  imports: [RouterLink, NgOptimizedImage, FavButtonComponent],
  templateUrl: './champion-details.component.html',
  styleUrl: './champion-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampionDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly championService = inject(ChampionService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map(params => Number(params.get('id'))))
  );

  readonly champion = computed(() => {
    const id = this.id();
    return id != null ? this.championService.getById(id) : undefined;
  });

  get championImageUrl(): string {
    const name = this.champion()?.name?.trim() ?? '';
    return `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${name}.png`;
  }

  toggleFavorite(): void {
    const id = this.id();
    if (id != null) this.championService.toggleFavorite(id);
  }
}
