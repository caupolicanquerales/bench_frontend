import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { OAuthService } from 'angular-oauth2-oidc';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  const mockOAuthService = {
    configure: () => {},
    loadDiscoveryDocumentAndTryLogin: async () => true,
    initCodeFlow: () => {},
    logOut: () => {},
    hasValidAccessToken: () => false,
    getAccessToken: () => '',
    getIdToken: () => '',
    getIdentityClaims: () => null as any,
    events: of()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: OAuthService, useValue: mockOAuthService }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load user from identity claims when present', () => {
    const claims = {
      sub: 'user-123',
      name: 'Test Athlete',
      email: 'athlete@example.com',
      roles: ['ROLE_ATHLETE']
    };
    mockOAuthService.getIdentityClaims = () => claims;

    service.loadUserFromSession();

    expect(service.currentUser()?.id).toBe('user-123');
    expect(service.userName()).toBe('Test Athlete');
    expect(service.userEmail()).toBe('athlete@example.com');
  });

  it('should fallback to Guest/Athlete defaults when unauthenticated', () => {
    mockOAuthService.getIdentityClaims = () => null;
    mockOAuthService.hasValidAccessToken = () => false;

    service.loadUserFromSession();

    expect(service.isSignedIn()).toBe(false);
    expect(service.userName()).toBe('Guest');
  });
});
