import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExplorerPresenter } from './explorer.presenter';

@Component({
  selector: 'app-champion-explorer',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './champion-explorer.component.html',
  styleUrl: './champion-explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExplorerPresenter],
})
export class ChampionExplorerComponent {
  readonly presenter = inject(ExplorerPresenter);
}
