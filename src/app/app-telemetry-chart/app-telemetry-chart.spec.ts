import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppTelemetryChart } from './app-telemetry-chart';

describe('AppTelemetryChart', () => {
  let component: AppTelemetryChart;
  let fixture: ComponentFixture<AppTelemetryChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppTelemetryChart],
    }).compileComponents();

    fixture = TestBed.createComponent(AppTelemetryChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
