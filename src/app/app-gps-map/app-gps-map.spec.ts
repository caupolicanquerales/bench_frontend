import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppGpsMap } from './app-gps-map';

describe('AppGpsMap', () => {
  let component: AppGpsMap;
  let fixture: ComponentFixture<AppGpsMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppGpsMap],
    }).compileComponents();

    fixture = TestBed.createComponent(AppGpsMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
