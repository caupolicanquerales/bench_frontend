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
    private initPromise: Promise<boolean> | null = null;

    constructor(private oauthService: OAuthService) {
        // Initialization handled via provideAppInitializer
    }

    public runInitialLoginSequence(): Promise<boolean> {
        if (!isPlatformBrowser(this.platformId)) {
            return Promise.resolve(false);
        }
        if (!this.initPromise) {
            this.initPromise = this.configureOAuth();
        }
        return this.initPromise;
    }

    private async configureOAuth(): Promise<boolean> {
        try {
            await this.configService.loadConfig();
            const config = createAuthConfig(this.configService.apiGatewayUrl);
            this.oauthService.configure(config);

            await this.oauthService.loadDiscoveryDocumentAndTryLogin();

            if (this.oauthService.hasValidAccessToken()) {
                this.oauthService.setupAutomaticSilentRefresh();
            }

            console.log('OAuth configured successfully. Valid access token:', this.oauthService.hasValidAccessToken());
            return this.oauthService.hasValidAccessToken();
        } catch (err) {
            console.error('Error initializing OAuth:', err);
            return false;
        }
    }

    async login(targetUrl?: string): Promise<void> {
        if (isPlatformBrowser(this.platformId)) {
            await this.runInitialLoginSequence();
            if (this.oauthService.hasValidAccessToken()) {
                return;
            }
            this.oauthService.initCodeFlow(targetUrl); // Redirects browser to Auth Server via Gateway
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
    
    hasValidAccessToken(): boolean {
        return isPlatformBrowser(this.platformId) && this.oauthService.hasValidAccessToken();
    }
}
