import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DashboardComponent } from './dashboard.component';
import { ChampionService } from '../champion.service';
import { RemoteChampion } from '../champion-api.service';

const REMOTE_AHRI: RemoteChampion = {
  id: 'Ahri',
  name: 'Ahri',
  title: 'the Nine-Tailed Fox',
  blurb: 'Ahri est une mage.',
  tags: ['Mage'],
  imageUrl: 'https://example.test/ahri.png',
};

const REMOTE_LEE_SIN: RemoteChampion = {
  id: 'LeeSin',
  name: 'Lee Sin',
  title: 'the Blind Monk',
  blurb: 'Lee Sin est un combattant.',
  tags: ['Fighter'],
  imageUrl: 'https://example.test/lee-sin.png',
};

describe('DashboardComponent (integration)', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let championService: ChampionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])],
    });
    championService = TestBed.inject(ChampionService);
  });

  afterEach(() => localStorage.clear());

  it('shows an empty-state message with a link to the explorer when no champion is tracked', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vous ne suivez encore aucun champion');
    expect(fixture.debugElement.queryAll(By.css('app-champion-card')).length).toBe(0);
    expect(fixture.debugElement.query(By.css('a[routerLink="/explorer"]'))).toBeTruthy();
  });

  it('renders one app-champion-card per tracked champion from the real ChampionService', () => {
    championService.addChampion(REMOTE_AHRI);
    championService.addChampion(REMOTE_LEE_SIN);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('app-champion-card'));
    expect(cards.length).toBe(2);
  });

  it('clicking a card fav button flows through presenter -> service -> card -> fav-button DOM', () => {
    championService.addChampion(REMOTE_AHRI);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(championService.champions()[0].isFavorite).toBe(false);

    const favButton = fixture.debugElement.query(By.css('app-fav-button button'));
    favButton.nativeElement.click();
    fixture.detectChanges();

    expect(championService.champions()[0].isFavorite).toBe(true);
    expect(favButton.attributes['aria-pressed']).toBe('true');
  });
});
