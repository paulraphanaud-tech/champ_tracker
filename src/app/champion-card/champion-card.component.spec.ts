import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChampionCardComponent } from './champion-card.component';

describe('ChampionCardComponent', () => {
  let component: ChampionCardComponent;
  let fixture: ComponentFixture<ChampionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChampionCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChampionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
