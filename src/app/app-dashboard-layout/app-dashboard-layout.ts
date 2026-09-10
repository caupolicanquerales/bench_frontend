import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppGpsMap } from '../app-gps-map/app-gps-map';
import { AppKpiSumary } from '../app-kpi-sumary/app-kpi-sumary';
import { AppTelemetryChart } from '../app-telemetry-chart/app-telemetry-chart';
import { AppActivityHeader } from '../app-activity-header/app-activity-header';
import { AppSidebarNav } from '../app-sidebar-nav/app-sidebar-nav';

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

  protected activityNotes = signal('Solid endurance workout across standard terrain. Maintained an even cadence through rolling elevations.');
  protected newCommentText = signal('');

  protected comments = signal<ActivityComment[]>([
    {
      id: 1,
      author: 'Alex Morgan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timeAgo: '2h ago',
      text: 'Great pace on that steep climb! Keep it up!'
    },
    {
      id: 2,
      author: 'David Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      timeAgo: '4h ago',
      text: 'Solid split times throughout the course.'
    }
  ]);

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
