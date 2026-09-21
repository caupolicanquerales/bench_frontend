import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { authGuard } from './oauth.guard';
import { AuthService } from '../../services/auth-service';

describe('authGuard', () => {
  let mockAuthService: {
    runInitialLoginSequence: ReturnType<typeof vi.fn>;
    hasValidAccessToken: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuthService = {
      runInitialLoginSequence: vi.fn(),
      hasValidAccessToken: vi.fn(),
      login: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
  });

  it('should allow activation when user is authenticated', async () => {
    mockAuthService.runInitialLoginSequence.mockResolvedValue(true);
    mockAuthService.hasValidAccessToken.mockReturnValue(true);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard' } as RouterStateSnapshot;

    const result = await TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(result).toBe(true);
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should redirect to login and block activation when user is not authenticated', async () => {
    mockAuthService.runInitialLoginSequence.mockResolvedValue(false);
    mockAuthService.hasValidAccessToken.mockReturnValue(false);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/dashboard' } as RouterStateSnapshot;

    const result = await TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(result).toBe(false);
    expect(mockAuthService.login).toHaveBeenCalledWith('/dashboard');
  });
});
