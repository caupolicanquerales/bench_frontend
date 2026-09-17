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
        await this.configService.loadConfig();
        const config = createAuthConfig(this.configService.apiGatewayUrl);
        this.oauthService.configure(config);

        this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
            console.log('OAuth configured successfully');
        }).catch(err => {
            console.error('Error initializing OAuth', err);
        });
    }

    login(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.oauthService.initCodeFlow(); // Redirects browser to Auth Server via Gateway
        }
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.oauthService.logOut();
        }
    }

    get isLogged(): boolean {
        return isPlatformBrowser(this.platformId) && this.oauthService.hasValidAccessToken();
    }

    get token(): string {
        return isPlatformBrowser(this.platformId) ? this.oauthService.getAccessToken() : '';
    }
  
}
