import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { OAuthService } from 'angular-oauth2-oidc';

describe('AuthService', () => {
  let service: AuthService;
  const mockOAuthService = {
    configure: () => {},
    loadDiscoveryDocumentAndTryLogin: async () => true,
    initCodeFlow: () => {},
    logOut: () => {},
    hasValidAccessToken: () => false,
    getAccessToken: () => ''
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
});
