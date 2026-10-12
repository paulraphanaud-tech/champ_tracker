import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Champion } from '../champion';

@Component({
  selector: 'app-champion-card',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './champion-card.component.html',
  styleUrl: './champion-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampionCardComponent {
  readonly champion = input.required<Champion>();

  readonly championImageUrl = computed(() =>
    `https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/${this.champion().name.replaceAll(' ', '')}.png`
  );
}
