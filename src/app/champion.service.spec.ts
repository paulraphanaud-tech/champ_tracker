import { TestBed } from '@angular/core/testing';
import { ChampionService } from './champion.service';
import { ChampionLane, ChampionRole } from './champion';
import { RemoteChampion } from './champion-api.service';

const REMOTE_AHRI: RemoteChampion = {
  id: 'Ahri',
  name: 'Ahri',
  title: 'the Nine-Tailed Fox',
  blurb: 'Ahri est une mage.',
  tags: ['Mage'],
  imageUrl: 'https://example.test/ahri.png',
};

const REMOTE_ZED: RemoteChampion = {
  id: 'Zed',
  name: 'Zed',
  title: 'the Master of Shadows',
  blurb: 'Le maître des ombres.',
  tags: ['Assassin'],
  imageUrl: 'https://example.test/zed.png',
};

describe('ChampionService (unit)', () => {
  let service: ChampionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChampionService);
  });

  afterEach(() => localStorage.clear());

  it('starts with an empty roster', () => {
    expect(service.champions()).toEqual([]);
  });

  it('toggleFavorite flips only the targeted champion, immutably', () => {
    service.addChampion(REMOTE_AHRI);
    service.addChampion(REMOTE_ZED);
    const before = service.champions();
    const target = before.find(c => c.name === 'Zed')!;

    service.toggleFavorite(target.id);

    const after = service.champions();
    expect(after).not.toBe(before);
    expect(after.find(c => c.id === target.id)!.isFavorite).toBe(!target.isFavorite);
    expect(after.filter(c => c.id !== target.id)).toEqual(before.filter(c => c.id !== target.id));
  });

  it('getById returns the matching champion or undefined', () => {
    service.addChampion(REMOTE_AHRI);
    const id = service.champions()[0].id;

    expect(service.getById(id)?.name).toBe('Ahri');
    expect(service.getById(999)).toBeUndefined();
  });

  it('isTracked reflects whether a champion name is already in the roster', () => {
    service.addChampion(REMOTE_AHRI);

    expect(service.isTracked('Ahri')).toBe(true);
    expect(service.isTracked('Zed')).toBe(false);
  });

  it('addChampion maps a RemoteChampion into a tracked Champion with default lane/difficulty', () => {
    service.addChampion(REMOTE_ZED);

    const added = service.champions().find(c => c.name === 'Zed');
    expect(added).toBeTruthy();
    expect(added?.role).toBe(ChampionRole.Assassin);
    expect(added?.lane).toBe(ChampionLane.Top);
    expect(added?.isFavorite).toBe(false);
    expect(added?.notes).toBe(REMOTE_ZED.blurb);
  });

  it('addChampion is a no-op when the champion is already tracked', () => {
    service.addChampion(REMOTE_AHRI);
    const before = service.champions().length;

    service.addChampion(REMOTE_AHRI);

    expect(service.champions().length).toBe(before);
  });

  it('removeChampion drops the matching champion by name', () => {
    service.addChampion(REMOTE_AHRI);
    service.addChampion(REMOTE_ZED);

    service.removeChampion(REMOTE_AHRI);

    expect(service.isTracked('Ahri')).toBe(false);
    expect(service.isTracked('Zed')).toBe(true);
  });

  it('removeChampion is a no-op when the champion is not tracked', () => {
    service.addChampion(REMOTE_ZED);
    const before = service.champions();

    service.removeChampion(REMOTE_AHRI);

    expect(service.champions()).toEqual(before);
  });

  it('persists the roster to localStorage so it survives a refresh', () => {
    service.addChampion(REMOTE_AHRI);
    TestBed.flushEffects(); // le persist() déclenché par effect() est planifié, pas synchrone

    const stored = JSON.parse(localStorage.getItem('champ-tracker.champions.v1')!);
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('Ahri');

    // Simule un refresh de page : nouvel injecteur, nouvelle instance du service.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const rehydrated = TestBed.inject(ChampionService);

    expect(rehydrated.champions().length).toBe(1);
    expect(rehydrated.champions()[0].name).toBe('Ahri');
  });
});
