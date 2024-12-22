import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnowGlobeComponent } from './snow-globe.component';

describe('SnowGlobeComponent', () => {
  let component: SnowGlobeComponent;
  let fixture: ComponentFixture<SnowGlobeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnowGlobeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnowGlobeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
