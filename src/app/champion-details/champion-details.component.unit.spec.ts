import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { ChampionDetailsComponent } from './champion-details.component';
import { ChampionService } from '../champion.service';
import { ChampionApiService } from '../champion-api.service';
import { Champion, ChampionLane, ChampionRole } from '../champion';

const AHRI: Champion = {
  id: 1,
  name: 'Ahri',
  role: ChampionRole.Mage,
  lane: ChampionLane.Mid,
  difficulty: 3,
  notes: 'Ahri est une mage.',
};

const NO_NOTES: Champion = { ...AHRI, id: 2, name: ' Zed ', notes: '' };

describe('ChampionDetailsComponent (unit)', () => {
  let fixture: ComponentFixture<ChampionDetailsComponent>;
  let component: ChampionDetailsComponent;
  let el: HTMLElement;
  // Le composant ne lit que getById / getChampionLore : des stubs partiels suffisent.
  let getById: ReturnType<typeof vi.fn<ChampionService['getById']>>;
  let getChampionLore: ReturnType<typeof vi.fn<ChampionApiService['getChampionLore']>>;
  // Sujet piloté à la main pour contrôler quand (et si) le lore « arrive ».
  let lore$: Subject<string | null>;

  function render(id: string | undefined): void {
    fixture = TestBed.createComponent(ChampionDetailsComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
  }

  function toggleButton(): HTMLButtonElement {
    return el.querySelector<HTMLButtonElement>('.details__toggle')!;
  }

  function notesText(): string {
    return el.querySelector('.details__notes-text')?.textContent ?? '';
  }

  function clickToggle(): void {
    toggleButton().click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    lore$ = new Subject<string | null>();
    getById = vi.fn<ChampionService['getById']>(id => [AHRI, NO_NOTES].find(c => c.id === id));
    getChampionLore = vi.fn<ChampionApiService['getChampionLore']>(() => lore$);

    TestBed.configureTestingModule({
      imports: [ChampionDetailsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ChampionService, useValue: { getById } satisfies Pick<ChampionService, 'getById'> },
        { provide: ChampionApiService, useValue: { getChampionLore } satisfies Pick<ChampionApiService, 'getChampionLore'> },
      ],
    });
  });

  describe('résolution du champion', () => {
    it('convertit l’input id en nombre avant d’interroger le service', () => {
      render('1');

      expect(getById).toHaveBeenCalledWith(1);
      expect(component.champion()).toBe(AHRI);
      expect(el.querySelector('.details__name')?.textContent).toBe('Ahri');
    });

    it.each([
      ['non numérique', 'abc'],
      ['absent', undefined],
    ])('n’interroge pas le service quand l’id est %s', (_label, id) => {
      render(id);

      expect(getById).not.toHaveBeenCalled();
      expect(component.champion()).toBeUndefined();
      expect(el.textContent).toContain('Champion introuvable.');
    });

    it('affiche l’état introuvable quand le service ne connaît pas l’id', () => {
      render('999');

      expect(getById).toHaveBeenCalledWith(999);
      expect(el.querySelector('.details--not-found')).not.toBeNull();
    });
  });

  describe('URL de l’image', () => {
    it('construit l’URL Data Dragon à partir du nom, sans les espaces autour', () => {
      render('2');

      expect(component.championImageUrl()).toBe(
        'https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/Zed.png'
      );
    });
  });

  describe('section notes', () => {
    it('n’est pas rendue quand le champion n’a pas de notes', () => {
      render('2');

      expect(el.querySelector('.details__notes')).toBeNull();
    });

    it('affiche le résumé stocké, replié, sans appeler l’API', () => {
      render('1');

      expect(notesText()).toBe('Ahri est une mage.');
      expect(toggleButton().textContent).toContain('Lire la suite');
      expect(toggleButton().getAttribute('aria-expanded')).toBe('false');
      expect(getChampionLore).not.toHaveBeenCalled();
    });
  });

  describe('dépliage du lore', () => {
    it('demande le lore au premier dépliage et signale le chargement', () => {
      render('1');

      clickToggle();

      expect(getChampionLore).toHaveBeenCalledOnce();
      expect(getChampionLore).toHaveBeenCalledWith('Ahri');
      expect(component.loreLoading()).toBe(true);
      expect(el.querySelector('.details__notes-text')?.getAttribute('aria-busy')).toBe('true');
      // Tant que le lore n'est pas arrivé, on garde le résumé plutôt qu'un texte vide.
      expect(notesText()).toBe('Ahri est une mage.');
    });

    it('affiche le lore complet une fois reçu', () => {
      render('1');
      clickToggle();

      lore$.next('Histoire complète d’Ahri.');
      fixture.detectChanges();

      expect(component.loreLoading()).toBe(false);
      expect(notesText()).toBe('Histoire complète d’Ahri.');
      expect(toggleButton().textContent).toContain('Réduire');
      expect(toggleButton().getAttribute('aria-expanded')).toBe('true');
    });

    it('revient au résumé au repli, puis réutilise le lore sans nouvel appel', () => {
      render('1');
      clickToggle();
      lore$.next('Histoire complète d’Ahri.');

      clickToggle();
      expect(notesText()).toBe('Ahri est une mage.');

      clickToggle();
      expect(notesText()).toBe('Histoire complète d’Ahri.');
      expect(getChampionLore).toHaveBeenCalledOnce();
    });

    it('ne relance pas d’appel si on replie et redéplie pendant le chargement', () => {
      render('1');

      clickToggle();
      clickToggle();
      clickToggle();

      expect(getChampionLore).toHaveBeenCalledOnce();
    });

    it('garde le résumé quand le lore est indisponible (null)', () => {
      render('1');
      clickToggle();

      lore$.next(null);
      fixture.detectChanges();

      expect(component.loreLoading()).toBe(false);
      expect(component.expanded()).toBe(true);
      expect(notesText()).toBe('Ahri est une mage.');
    });

    it('ne fait rien quand aucun champion n’est résolu', () => {
      render('999');

      component.toggleDescription();

      expect(component.expanded()).toBe(false);
      expect(getChampionLore).not.toHaveBeenCalled();
    });

    it('se désabonne de la requête en cours quand le composant est détruit', () => {
      render('1');
      clickToggle();
      expect(lore$.observed).toBe(true);

      fixture.destroy();

      expect(lore$.observed).toBe(false);
    });
  });
});
