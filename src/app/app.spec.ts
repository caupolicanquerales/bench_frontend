import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './services/auth-service';

describe('App', () => {
  beforeEach(async () => {
    const mockAuthService = {
      login: () => {},
      register: () => {},
      logout: () => {},
      isLogged: false,
      token: '',
      hasValidAccessToken: () => false,
      runInitialLoginSequence: () => Promise.resolve(false)
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
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
