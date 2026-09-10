import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppDashboardLayout } from './app-dashboard-layout';

describe('AppDashboardLayout', () => {
  let component: AppDashboardLayout;
  let fixture: ComponentFixture<AppDashboardLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppDashboardLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(AppDashboardLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
