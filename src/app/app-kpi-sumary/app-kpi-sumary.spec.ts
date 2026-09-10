import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppKpiSumary } from './app-kpi-sumary';

describe('AppKpiSumary', () => {
  let component: AppKpiSumary;
  let fixture: ComponentFixture<AppKpiSumary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppKpiSumary],
    }).compileComponents();

    fixture = TestBed.createComponent(AppKpiSumary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
