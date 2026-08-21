import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DashboardPresenter } from './dashboard.presenter';
import { ChampionService } from '../champion.service';
import { Champion, ChampionLane, ChampionRole } from '../champion';

const CHAMPIONS: Champion[] = [
  { id: 1, name: 'Ahri', role: ChampionRole.Mage, lane: ChampionLane.Mid, difficulty: 3, isFavorite: true, notes: '' },
  { id: 2, name: 'Lee Sin', role: ChampionRole.Fighter, lane: ChampionLane.Jungle, difficulty: 5, isFavorite: false, notes: '' },
];

describe('DashboardPresenter (unit)', () => {
  let presenter: DashboardPresenter;
  let championServiceSpy: jasmine.SpyObj<ChampionService>;

  beforeEach(() => {
    championServiceSpy = jasmine.createSpyObj<ChampionService>(
      'ChampionService',
      ['toggleFavorite'],
      { champions: signal(CHAMPIONS) }
    );

    TestBed.configureTestingModule({
      providers: [
        DashboardPresenter,
        { provide: ChampionService, useValue: championServiceSpy },
      ],
    });
    presenter = TestBed.inject(DashboardPresenter);
  });

  it('exposes all service champions when there is no search query', () => {
    expect(presenter.champions()).toEqual(CHAMPIONS);
  });

  it('hasAnyChampion is true as soon as the service has at least one champion', () => {
    expect(presenter.hasAnyChampion()).toBe(true);
  });

  it('updateSearch filters champions by name, case-insensitively', () => {
    presenter.updateSearch('lee');

    expect(presenter.champions()).toEqual([CHAMPIONS[1]]);
  });

  it('toggleFavorite delegates to ChampionService.toggleFavorite with the given id', () => {
    presenter.toggleFavorite(42);

    expect(championServiceSpy.toggleFavorite).toHaveBeenCalledOnceWith(42);
  });
});

describe('DashboardPresenter (unit) — empty roster', () => {
  it('hasAnyChampion is false when the service has no champion', () => {
    const emptySpy = jasmine.createSpyObj<ChampionService>(
      'ChampionService',
      ['toggleFavorite'],
      { champions: signal([]) }
    );

    TestBed.configureTestingModule({
      providers: [DashboardPresenter, { provide: ChampionService, useValue: emptySpy }],
    });
    const presenter = TestBed.inject(DashboardPresenter);

    expect(presenter.hasAnyChampion()).toBe(false);
  });
});
