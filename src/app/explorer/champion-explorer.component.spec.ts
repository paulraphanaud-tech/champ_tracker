import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ChampionExplorerComponent } from './champion-explorer.component';
import { ChampionService } from '../champion.service';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const CHAMPIONS_URL = 'https://ddragon.leagueoflegends.com/cdn/14.5.1/data/fr_FR/champion.json';

const CHAMPION_RESPONSE = {
  data: {
    Ahri: {
      id: 'Ahri',
      name: 'Ahri',
      title: 'the Nine-Tailed Fox',
      blurb: 'Ahri est une mage.',
      tags: ['Mage'],
      image: { full: 'Ahri.png' },
    },
  },
};

describe('ChampionExplorerComponent (integration)', () => {
  let fixture: ComponentFixture<ChampionExplorerComponent>;
  let httpMock: HttpTestingController;
  let championService: ChampionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ChampionExplorerComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    championService = TestBed.inject(ChampionService);

    fixture = TestBed.createComponent(ChampionExplorerComponent);
    fixture.detectChanges();

    httpMock.expectOne(VERSIONS_URL).flush(['14.5.1']);
    httpMock.expectOne(CHAMPIONS_URL).flush(CHAMPION_RESPONSE);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function trackButton() {
    return fixture.debugElement.query(By.css('.explorer-card__track'));
  }

  it('shows a "Suivre" button for a champion not yet tracked', () => {
    expect(trackButton().nativeElement.textContent.trim()).toBe('Suivre ce champion');
  });

  it('tracking a champion adds it to ChampionService and flips the button to "Ne plus suivre"', () => {
    trackButton().nativeElement.click();
    fixture.detectChanges();

    expect(championService.isTracked('Ahri')).toBe(true);
    expect(trackButton().nativeElement.textContent.trim()).toBe('Ne plus suivre');
  });

  it('untracking a previously tracked champion removes it from ChampionService', () => {
    trackButton().nativeElement.click(); // suivre
    fixture.detectChanges();

    trackButton().nativeElement.click(); // ne plus suivre
    fixture.detectChanges();

    expect(championService.isTracked('Ahri')).toBe(false);
    expect(trackButton().nativeElement.textContent.trim()).toBe('Suivre ce champion');
  });
});
