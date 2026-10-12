import { TestBed } from '@angular/core/testing';
import { signal, provideZonelessChangeDetection } from '@angular/core';
import { DashboardPresenter } from './dashboard.presenter';
import { ChampionService } from '../champion.service';
import { Champion, ChampionLane, ChampionRole } from '../champion';

const CHAMPIONS: Champion[] = [
  { id: 1, name: 'Ahri', role: ChampionRole.Mage, lane: ChampionLane.Mid, difficulty: 3, notes: '' },
  { id: 2, name: 'Lee Sin', role: ChampionRole.Fighter, lane: ChampionLane.Jungle, difficulty: 5, notes: '' },
];

/** Le presenter ne lit que `champions` : un stub partiel suffit. */
type ChampionServiceStub = Pick<ChampionService, 'champions'>;

describe('DashboardPresenter (unit)', () => {
  let presenter: DashboardPresenter;
  let championServiceStub: ChampionServiceStub;

  beforeEach(() => {
    championServiceStub = { champions: signal(CHAMPIONS) };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DashboardPresenter,
        { provide: ChampionService, useValue: championServiceStub },
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
});

describe('DashboardPresenter (unit) — empty roster', () => {
  it('hasAnyChampion is false when the service has no champion', () => {
    const emptyStub: ChampionServiceStub = { champions: signal<Champion[]>([]) };

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), DashboardPresenter, { provide: ChampionService, useValue: emptyStub }],
    });
    const presenter = TestBed.inject(DashboardPresenter);

    expect(presenter.hasAnyChampion()).toBe(false);
  });
});
