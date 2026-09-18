import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { AuthService } from './services/auth-service';

describe('App', () => {
  beforeEach(async () => {
    const mockAuthService = {
      login: () => {},
      register: () => {},
      logout: () => {},
      isLogged: false,
      token: ''
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
