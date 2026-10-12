import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChampionApiService } from './champion-api.service';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const CHAMPIONS_URL = 'https://ddragon.leagueoflegends.com/cdn/14.5.1/data/fr_FR/champion.json';

const CHAMPION_RESPONSE = {
  data: {
    Ahri: {
      id: 'Ahri',
      name: 'Ahri',
      title: 'the Nine-Tailed Fox',
      blurb: 'Ahri est une mage.',
      tags: ['Mage', 'Assassin'],
      image: { full: 'Ahri.png' },
    },
    Zed: {
      id: 'Zed',
      name: 'Zed',
      title: 'the Master of Shadows',
      blurb: 'Zed est un assassin.',
      tags: ['Assassin'],
      image: { full: 'Zed.png' },
    },
  },
};

describe('ChampionApiService (unit)', () => {
  let service: ChampionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChampionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the latest version, then the champion list, and maps it', () => {
    let result: unknown;
    service.getAllChampions().subscribe(champions => (result = champions));

    httpMock.expectOne(VERSIONS_URL).flush(['14.5.1', '14.4.1']);
    httpMock.expectOne(CHAMPIONS_URL).flush(CHAMPION_RESPONSE);

    expect(result).toEqual([
      {
        id: 'Ahri',
        name: 'Ahri',
        title: 'the Nine-Tailed Fox',
        blurb: 'Ahri est une mage.',
        tags: ['Mage', 'Assassin'],
        imageUrl: 'https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/Ahri.png',
      },
      {
        id: 'Zed',
        name: 'Zed',
        title: 'the Master of Shadows',
        blurb: 'Zed est un assassin.',
        tags: ['Assassin'],
        imageUrl: 'https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/Zed.png',
      },
    ]);
  });

  it('caches the result: a second subscriber does not trigger new HTTP calls', () => {
    service.getAllChampions().subscribe();
    httpMock.expectOne(VERSIONS_URL).flush(['14.5.1']);
    httpMock.expectOne(CHAMPIONS_URL).flush(CHAMPION_RESPONSE);

    let secondResult: unknown;
    service.getAllChampions().subscribe(champions => (secondResult = champions));

    httpMock.expectNone(VERSIONS_URL);
    httpMock.expectNone(CHAMPIONS_URL);
    expect((secondResult as unknown[]).length).toBe(2);
  });

  it('resolves to an empty list instead of erroring when the network call fails', () => {
    let result: unknown;
    service.getAllChampions().subscribe(champions => (result = champions));

    httpMock.expectOne(VERSIONS_URL).error(new ProgressEvent('network error'));

    expect(result).toEqual([]);
  });

  it('fetches the full lore of a champion by its display name', () => {
    let lore: string | null | undefined;
    service.getChampionLore('Ahri').subscribe(result => (lore = result));

    httpMock.expectOne(VERSIONS_URL).flush(['14.5.1']);
    httpMock.expectOne(CHAMPIONS_URL).flush(CHAMPION_RESPONSE);
    httpMock
      .expectOne('https://ddragon.leagueoflegends.com/cdn/14.5.1/data/fr_FR/champion/Ahri.json')
      .flush({ data: { Ahri: { lore: 'Le lore complet.' } } });

    expect(lore).toBe('Le lore complet.');
  });

  it('resolves the lore to null for an unknown champion', () => {
    let lore: string | null | undefined;
    service.getChampionLore('Inconnu').subscribe(result => (lore = result));

    httpMock.expectOne(VERSIONS_URL).flush(['14.5.1']);
    httpMock.expectOne(CHAMPIONS_URL).flush(CHAMPION_RESPONSE);

    expect(lore).toBeNull();
  });
});
