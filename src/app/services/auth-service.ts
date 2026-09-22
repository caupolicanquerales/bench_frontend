import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { createAuthConfig } from '../core/oauth/oauth.config';
import { ConfigService } from './config.service';
import { UserProfile } from '../shared/constants/auth-service-constant';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private platformId = inject(PLATFORM_ID);
    private configService = inject(ConfigService);
    private initPromise: Promise<boolean> | null = null;
    private currentUserSignal = signal<UserProfile | null>(null);

    public currentUser = this.currentUserSignal.asReadonly();

    public isSignedIn = computed(() => {
        if (!isPlatformBrowser(this.platformId)) {
            return false;
        }
        return this.currentUserSignal() !== null || this.oauthService.hasValidAccessToken();
    });

    public isConnected = computed(() => {
        if (!isPlatformBrowser(this.platformId)) {
            return false;
        }
        return this.oauthService.hasValidAccessToken();
    });

    public userName = computed(() => {
        const user = this.currentUserSignal();
        if (!user) {
            return this.isSignedIn() ? 'Athlete' : 'Guest';
        }
        return user.fullName || user.username || 'Athlete';
    });

    public displayName = computed(() => {
        return this.userName();
    });

    public userEmail = computed(() => {
        return this.currentUserSignal()?.email || '';
    });

    public userRole = computed(() => {
        const roles = this.currentUserSignal()?.roles;
        if (roles && roles.length > 0) {
            return roles[0]
                .replace(/^ROLE_/, '')
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
        }
        return 'Pro Athlete';
    });

    public avatarUrl = computed(() => {
        return this.currentUserSignal()?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
    });

    constructor(private oauthService: OAuthService) {
        if (isPlatformBrowser(this.platformId)) {
            this.loadUserFromSession();
            this.setupEventSubscriptions();
        }
    }

    private setupEventSubscriptions(): void {
        this.oauthService.events?.subscribe((event) => {
            if (['token_received', 'token_refreshed', 'user_profile_loaded'].includes(event.type)) {
                this.loadUserFromSession();
            } else if (['logout', 'session_terminated', 'token_expires'].includes(event.type)) {
                if (!this.oauthService.hasValidAccessToken()) {
                    this.currentUserSignal.set(null);
                }
            }
        });
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

            this.loadUserFromSession();

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
            try {
                this.oauthService.logOut(true);
            } catch {
                // If token revocation fails or tokens are expired, continue clearing local storage
            }
            this.currentUserSignal.set(null);
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

    public loadUserFromSession(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        // 1. Try angular-oauth2-oidc identity claims directly (parsed from id_token)
        try {
            const identityClaims = this.oauthService.getIdentityClaims() as any;
            if (identityClaims && (identityClaims.sub || identityClaims.email || identityClaims.preferred_username || identityClaims.name)) {
                this.setUserFromClaims(identityClaims);
                return;
            }
        } catch {}

        // 2. Search in all storage mechanisms: OAuthService, sessionStorage, localStorage, and cookie
        const token = this.findToken();
        if (token) {
            const payload = this.decodeTokenPayload(token);
            if (payload && (payload.sub || payload.email || payload.preferred_username || payload.name)) {
                this.setUserFromClaims(payload);
                return;
            }
        }

        // 3. Fallback: If no valid claims or tokens, clear user state
        if (!this.oauthService.hasValidAccessToken()) {
            this.currentUserSignal.set(null);
        }
    }

    private setUserFromClaims(claims: any): void {
        const roles = Array.isArray(claims.roles)
            ? claims.roles
            : Array.isArray(claims.authorities)
            ? claims.authorities
            : typeof claims.scope === 'string'
            ? claims.scope.split(' ')
            : [];

        this.currentUserSignal.set({
            id: String(claims.sub || claims.id || ''),
            username: claims.preferred_username || claims.username || claims.sub || 'Athlete',
            fullName: claims.name || claims.fullName || claims.given_name || claims.preferred_username || claims.sub || 'Athlete',
            email: claims.email || '',
            roles: roles,
            avatarUrl: claims.picture || claims.avatarUrl
        });
    }

    private findToken(): string | null {
        // A. From OAuthService directly
        try {
            const idToken = this.oauthService.getIdToken();
            if (idToken) return idToken;
            const accessToken = this.oauthService.getAccessToken();
            if (accessToken) return accessToken;
        } catch {}

        if (typeof window === 'undefined') {
            return null;
        }

        // B. From sessionStorage (angular-oauth2-oidc default storage location)
        try {
            const sessionToken = sessionStorage.getItem('id_token') || sessionStorage.getItem('access_token');
            if (sessionToken) return sessionToken;
        } catch {}

        // C. From localStorage (fallback if customized or manual storage)
        try {
            const localToken = localStorage.getItem('id_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
            if (localToken) return localToken;
        } catch {}

        // D. From document.cookie (if stored in a client-readable cookie)
        try {
            const cookieToken = this.getCookie('id_token') ||
                                this.getCookie('access_token') ||
                                this.getCookie('token') ||
                                this.getCookie('auth_token');
            if (cookieToken) return cookieToken;
        } catch {}

        return null;
    }

    private getCookie(name: string): string | null {
        if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') {
            return null;
        }
        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : null;
    }

    private decodeTokenPayload(token: string): any {
        try {
            const parts = token.split('.');
            if (parts.length < 2) {
                return {};
            }
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return {};
        }
    }
}
