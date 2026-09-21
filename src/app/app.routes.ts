import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard } from './core/oauth/oauth.guard';
import { AppDashboardLayout } from './app-dashboard-layout/app-dashboard-layout';

export const routes: Routes = [
  { 
    path: '', 
    pathMatch: 'full', 
    redirectTo: (route) => {
      const router = inject(Router);
      return router.createUrlTree(['/dashboard'], { queryParams: route.queryParams });
    }
  },
  { 
    path: 'dashboard', 
    component: AppDashboardLayout, 
    canActivate: [authGuard] 
  },
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];