import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth-service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);

  // Check if an OAuth redirect code is incoming before any processing
  const hasCodeInUrl = typeof window !== 'undefined' && (
    window.location.search.includes('code=') ||
    !!route.queryParams?.['code']
  );

  // 1. Wait for OAuth discovery & code processing to finish
  await authService.runInitialLoginSequence();

  // 2. Check if access token is present
  if (authService.hasValidAccessToken()) {
    return true;
  }

  // 3. If a redirect code is currently present in URL, allow routing to complete without looping
  if (hasCodeInUrl) {
    return true;
  }

  // 4. Trigger redirect to Spring Auth Server if completely unauthenticated
  await authService.login(state.url);
  return false;
};