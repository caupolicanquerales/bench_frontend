import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppActivityHeader } from './app-activity-header';

describe('AppActivityHeader', () => {
  let component: AppActivityHeader;
  let fixture: ComponentFixture<AppActivityHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppActivityHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(AppActivityHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
