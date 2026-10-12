import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChampionCardComponent } from './champion-card.component';
import { Champion, ChampionLane, ChampionRole } from '../champion';

const CHAMPION: Champion = {
  id: 1,
  name: 'Ahri',
  role: ChampionRole.Mage,
  lane: ChampionLane.Mid,
  difficulty: 3,
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
});
