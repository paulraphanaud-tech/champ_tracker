import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChampionDetailsComponent } from './champion-details.component';
import { ChampionService } from '../champion.service';
import { RemoteChampion } from '../champion-api.service';
import { appConfig } from '../app.config';

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

describe('ChampionDetailsComponent (integration)', () => {
  let championService: ChampionService;

  function createFixture(id: string): ComponentFixture<ChampionDetailsComponent> {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ChampionDetailsComponent],
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    championService = TestBed.inject(ChampionService);
    // Ahri obtient l'id 1, Lee Sin l'id 2 (auto-incrément dans ChampionService).
    championService.addChampion(REMOTE_AHRI);
    championService.addChampion(REMOTE_LEE_SIN);
    const fixture = TestBed.createComponent(ChampionDetailsComponent);
    // Équivalent de ce que fait withComponentInputBinding() avec le paramètre `:id`.
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => localStorage.clear());

  it('resolves the champion from the route id via the real ChampionService', () => {
    const fixture = createFixture('1');
    expect(fixture.componentInstance.champion()?.name).toBe('Ahri');
    expect(fixture.nativeElement.textContent).toContain('Ahri');
  });

  it('receives the :id route param as an input through the real app routing config', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    TestBed.inject(ChampionService).addChampion(REMOTE_AHRI);

    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/champion/1', ChampionDetailsComponent);

    expect(component.champion()?.name).toBe('Ahri');
    expect(harness.routeNativeElement?.textContent).toContain('Ahri');
  });

  it('shows a not-found state when no champion matches the route id', () => {
    const fixture = createFixture('999');
    expect(fixture.componentInstance.champion()).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('introuvable');
  });

  it('expands the card and lazily loads the full lore on first expand only', () => {
    const fixture = createFixture('1');
    const httpMock = TestBed.inject(HttpTestingController);
    const el: HTMLElement = fixture.nativeElement;
    const button = el.querySelector<HTMLButtonElement>('.details__toggle')!;

    expect(el.querySelector('.details__notes-text')?.textContent).toContain('Ahri est une mage.');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    httpMock.expectNone(() => true);

    button.click();
    fixture.detectChanges();

    httpMock.expectOne('https://ddragon.leagueoflegends.com/api/versions.json').flush(['14.5.1']);
    httpMock.expectOne('https://ddragon.leagueoflegends.com/cdn/14.5.1/data/fr_FR/champion.json').flush({
      data: { Ahri: { id: 'Ahri', name: 'Ahri', title: '', blurb: '', tags: ['Mage'], image: { full: 'Ahri.png' } } },
    });
    httpMock.expectOne('https://ddragon.leagueoflegends.com/cdn/14.5.1/data/fr_FR/champion/Ahri.json').flush({
      data: { Ahri: { lore: 'Histoire complète d\'Ahri.' } },
    });
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.details__notes-text')?.textContent).toContain('Histoire complète d\'Ahri.');

    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    httpMock.expectNone(() => true);
    httpMock.verify();
  });
});
