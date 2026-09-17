import { AuthConfig } from 'angular-oauth2-oidc';

export function createAuthConfig(gatewayUrl: string = 'http://localhost:8082'): AuthConfig {
  const isBrowser = typeof window !== 'undefined';
  const isHttps = isBrowser && window.location.protocol === 'https:';

  return {
    issuer: gatewayUrl, // API Gateway routing to Auth Server
    redirectUri: isBrowser ? window.location.origin : 'http://localhost:4200',
    clientId: 'my-angular-client',
    responseType: 'code',
    scope: 'openid profile',
    showDebugInformation: !isHttps,
    requireHttps: isHttps,
  };
}

export const authCodeFlowConfig: AuthConfig = createAuthConfig();