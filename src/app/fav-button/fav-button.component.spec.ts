import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FavButtonComponent } from './fav-button.component';

describe('FavButtonComponent (component)', () => {
  let fixture: ComponentFixture<FavButtonComponent>;
  let component: FavButtonComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FavButtonComponent] });
    fixture = TestBed.createComponent(FavButtonComponent);
    component = fixture.componentInstance;
  });

  function setFavorite(value: boolean): void {
    fixture.componentRef.setInput('isFavorite', value);
    fixture.detectChanges();
  }

  it('reflects isFavorite in aria-pressed and the active class', () => {
    setFavorite(true);
    const button = fixture.debugElement.query(By.css('button'));

    expect(button.attributes['aria-pressed']).toBe('true');
    expect(button.nativeElement.classList).toContain('fav-btn--active');
  });

  it('emits toggled when clicked', () => {
    setFavorite(false);
    const emitted = jasmine.createSpy('toggled');
    component.toggled.subscribe(emitted);

    fixture.debugElement.query(By.css('button')).nativeElement.click();

    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('stops propagation so a fav toggle inside a link does not trigger navigation', () => {
    setFavorite(false);
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    spyOn(clickEvent, 'stopPropagation').and.callThrough();
    spyOn(clickEvent, 'preventDefault').and.callThrough();

    fixture.debugElement.query(By.css('button')).nativeElement.dispatchEvent(clickEvent);

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(clickEvent.preventDefault).toHaveBeenCalled();
  });
});
