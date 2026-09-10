import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppSidebarNav } from './app-sidebar-nav';

describe('AppSidebarNav', () => {
  let component: AppSidebarNav;
  let fixture: ComponentFixture<AppSidebarNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarNav],
    }).compileComponents();

    fixture = TestBed.createComponent(AppSidebarNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
