import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ChampionCardComponent } from './champion-card.component';
import { Champion, ChampionLane, ChampionRole } from '../champion';

const CHAMPION: Champion = {
  id: 1,
  name: 'Ahri',
  role: ChampionRole.Mage,
  lane: ChampionLane.Mid,
  difficulty: 3,
  isFavorite: false,
  notes: '',
};

describe('ChampionCardComponent (component)', () => {
  let fixture: ComponentFixture<ChampionCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChampionCardComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ChampionCardComponent);
    fixture.componentRef.setInput('champion', CHAMPION);
    fixture.detectChanges();
  });

  it('renders the champion name, role, lane and difficulty', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ahri');
    expect(text).toContain(ChampionRole.Mage);
    expect(text).toContain(ChampionLane.Mid);
    expect(text).toContain('3/5');
  });

  it('forwards isFavorite to the nested app-fav-button', () => {
    const favButton = fixture.debugElement.query(By.css('app-fav-button button'));
    expect(favButton.attributes['aria-pressed']).toBe('false');
  });

  it('emits favToggled and does not navigate when the fav button is clicked', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    const emitted = jasmine.createSpy('favToggled');
    fixture.componentInstance.favToggled.subscribe(emitted);

    fixture.debugElement.query(By.css('app-fav-button button')).nativeElement.click();

    expect(emitted).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
