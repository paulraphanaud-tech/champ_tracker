import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Champion } from '../champion';
import { FavButtonComponent } from '../fav-button/fav-button.component';

@Component({
  selector: 'app-champion-card',
  imports: [NgOptimizedImage, FavButtonComponent, RouterLink],
  templateUrl: './champion-card.component.html',
  styleUrl: './champion-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampionCardComponent {
  readonly champion = input.required<Champion>();
  readonly favToggled = output<void>();

  get championImageUrl(): string {
    const url = `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${this.champion().name.replaceAll(' ', '')}.png`;
    return url;
  }

  onFavToggled(): void {
    console.log('[ChampionCard] championImageUrl:', this.championImageUrl);
    this.favToggled.emit();
  }
}
