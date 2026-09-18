import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { createAuthConfig } from '../core/oauth/oauth.config';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private platformId = inject(PLATFORM_ID);
    private configService = inject(ConfigService);

    constructor(private oauthService: OAuthService) {
        if (isPlatformBrowser(this.platformId)) {
            this.configureOAuth();
        }
    }

    private async configureOAuth(): Promise<void> {
        try {
            await this.configService.loadConfig();
            const config = createAuthConfig(this.configService.apiGatewayUrl);
            this.oauthService.configure(config);

            await this.oauthService.loadDiscoveryDocumentAndTryLogin();
            console.log('OAuth configured successfully');
        } catch (err) {
            console.error('Error initializing OAuth:', err);
        }
    }

    login(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.oauthService.initCodeFlow(); // Redirects browser to Auth Server via Gateway
        }
    }

    register(): void {
        if (isPlatformBrowser(this.platformId)) {
            window.location.href = `${this.configService.apiGatewayUrl}/register`;
        }
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Revoke local tokens and clear stored OAuth state
            try {
                this.oauthService.logOut(true);
            } catch {
                // If token revocation fails or tokens are expired, continue clearing local storage
            }

            // Invalidate Spring Security session, delete cookies, and redirect to login.html with ?logout=true
            const gatewayUrl = this.configService.apiGatewayUrl;
            window.location.href = `${gatewayUrl}/logout`;
        }
    }

    get isLogged(): boolean {
        return isPlatformBrowser(this.platformId) && this.oauthService.hasValidAccessToken();
    }

    get token(): string {
        return isPlatformBrowser(this.platformId) ? this.oauthService.getAccessToken() : '';
    }
  
}
