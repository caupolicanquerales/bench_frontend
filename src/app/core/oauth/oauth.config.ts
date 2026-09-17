import { AuthConfig } from 'angular-oauth2-oidc';

export function createAuthConfig(gatewayUrl: string = 'http://localhost:8082'): AuthConfig {
  const isBrowser = typeof window !== 'undefined';

  return {
    issuer: gatewayUrl, // API Gateway routing to Auth Server
    redirectUri: isBrowser ? window.location.origin : 'http://localhost:4200',
    clientId: 'my-angular-client',
    responseType: 'code',
    scope: 'openid profile',
    showDebugInformation: true,
    // Set to false to avoid strict TLS rejection when running locally or behind reverse proxies
    requireHttps: false,
    strictDiscoveryDocumentValidation: false,
  };
}

export const authCodeFlowConfig: AuthConfig = createAuthConfig();