import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-fav-button',
  imports: [],
  templateUrl: './fav-button.component.html',
  styleUrl: './fav-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavButtonComponent {
  readonly isFavorite = input.required<boolean>();
  readonly toggled = output<void>();

  toggle(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.toggled.emit();
  }
}
