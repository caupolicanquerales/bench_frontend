import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppGpsMap } from '../app-gps-map/app-gps-map';
import { AppKpiSumary } from '../app-kpi-sumary/app-kpi-sumary';
import { AppTelemetryChart } from '../app-telemetry-chart/app-telemetry-chart';
import { AppActivityHeader } from '../app-activity-header/app-activity-header';
import { AppSidebarNav } from '../app-sidebar-nav/app-sidebar-nav';
import { GeneralService } from '../services/general.service';

interface ActivityComment {
  id: number;
  author: string;
  avatar: string;
  timeAgo: string;
  text: string;
}

@Component({
  imports: [
    FormsModule,
    AppSidebarNav,
    AppActivityHeader,
    AppKpiSumary,
    AppGpsMap,
    AppTelemetryChart
  ],
  selector: 'app-dashboard-layout',
  standalone: true,
  styleUrl: './app-dashboard-layout.scss',
  templateUrl: './app-dashboard-layout.html',
})
export class AppDashboardLayout {
  protected isMobileNavOpen = signal(false);
  protected isContextualDrawerOpen = signal(false);
  protected hasLoadedActivity = signal(false);

  protected activityNotes = signal('');
  protected newCommentText = signal('');

  protected comments = signal<ActivityComment[]>([]);

  constructor(private generalService: GeneralService) {
    this.generalService.summaryData$.subscribe((isLoaded) => {
      this.hasLoadedActivity.set(isLoaded);
      if (!isLoaded) {
        this.activityNotes.set('');
        this.comments.set([]);
      }
    });
  }

  protected addComment(): void {
    const text = this.newCommentText().trim();
    if (!text) return;

    this.comments.update((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        timeAgo: 'Just now',
        text
      }
    ]);
    this.newCommentText.set('');
  }

  protected toggleMobileNav(): void {
    this.isMobileNavOpen.update((open) => !open);
    if (this.isMobileNavOpen()) {
      this.isContextualDrawerOpen.set(false);
    }
  }

  protected closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }

  protected toggleContextualDrawer(): void {
    this.isContextualDrawerOpen.update((open) => !open);
    if (this.isContextualDrawerOpen()) {
      this.isMobileNavOpen.set(false);
    }
  }

  protected closeContextualDrawer(): void {
    this.isContextualDrawerOpen.set(false);
  }
}
