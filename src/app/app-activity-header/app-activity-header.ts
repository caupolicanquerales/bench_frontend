import { Component, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-activity-header',
  standalone: true,
  styleUrl: './app-activity-header.scss',
  templateUrl: './app-activity-header.html',
})
export class AppActivityHeader {
  // Activity identity state
  public activityTitle = signal('Ciudad de Buenos Aires Carrera');
  public isEditingTitle = signal(false);
  public editTitleDraft = signal('');
  public activitySubtitle = signal('Running • Sunday Morning Session');

  // Authentication & User Profile state
  public isSignedIn = signal(true);
  public userName = signal('Matías Albornoz');
  public userEmail = signal('matias@apextelemetry.io');
  public userRole = signal('Pro Athlete');
  public userTeam = signal('Apex Endurance Team');
  public isConnected = signal(true);
  public userAvatar = signal(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  );

  // Profile dropdown menu state
  public isProfileMenuOpen = signal(false);
  public isSwitchingTeam = signal(false);
  public availableTeams = signal([
    'Apex Endurance Team',
    'Buenos Aires Striders',
    'Personal Solo Athlete',
  ]);

  // User Preferences state
  public isDarkMode = signal(false);
  public selectedLanguage = signal<'EN' | 'ES'>('EN');
  public activeFeedback = signal<string | null>(null);

  // Title edit handlers
  protected startEditingTitle(): void {
    this.editTitleDraft.set(this.activityTitle());
    this.isEditingTitle.set(true);
  }

  protected saveTitle(): void {
    const trimmed = this.editTitleDraft().trim();
    if (trimmed) {
      this.activityTitle.set(trimmed);
    }
    this.isEditingTitle.set(false);
  }

  protected cancelEditingTitle(): void {
    this.isEditingTitle.set(false);
  }

  // Profile dropdown handlers
  public toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen.update((open) => !open);
    if (!this.isProfileMenuOpen()) {
      this.isSwitchingTeam.set(false);
    }
  }

  public closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
    this.isSwitchingTeam.set(false);
  }

  // Profile Management handlers
  public viewProfile(): void {
    this.showFeedback('Navigating to full Athlete Profile...');
    this.closeProfileMenu();
  }

  public editUserDetails(): void {
    this.showFeedback('Opening Athlete Bio & Training Zones editor...');
    this.closeProfileMenu();
  }

  public toggleTeamSwitcher(): void {
    this.isSwitchingTeam.update((v) => !v);
  }

  public selectTeam(team: string): void {
    this.userTeam.set(team);
    this.isSwitchingTeam.set(false);
    this.showFeedback(`Switched team to "${team}"`);
  }

  public openSettings(): void {
    this.showFeedback('Opening Account & Security Settings...');
    this.closeProfileMenu();
  }

  // Preferences handlers
  public toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
    if (typeof document !== 'undefined') {
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    this.showFeedback(this.isDarkMode() ? 'Switched to Dark Mode' : 'Switched to Light Mode');
  }

  public toggleLanguage(): void {
    const nextLang = this.selectedLanguage() === 'EN' ? 'ES' : 'EN';
    this.selectedLanguage.set(nextLang);
    this.showFeedback(nextLang === 'EN' ? 'Language set to English' : 'Idioma cambiado a Español');
  }

  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  public showFeedback(msg: string): void {
    this.activeFeedback.set(msg);
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = setTimeout(() => {
      this.activeFeedback.set(null);
    }, 3000);
  }

  public dismissFeedback(): void {
    this.activeFeedback.set(null);
  }

  // Auth toggle simulation
  public signIn(): void {
    this.isSignedIn.set(true);
    this.isConnected.set(true);
    this.showFeedback('Signed in as Matías Albornoz');
  }

  public register(): void {
    this.isSignedIn.set(true);
    this.isConnected.set(true);
    this.showFeedback('Welcome! Registered athlete account created.');
  }

  public signOut(): void {
    this.isSignedIn.set(false);
    this.isConnected.set(false);
    this.isProfileMenuOpen.set(false);
    this.isSwitchingTeam.set(false);
    this.showFeedback('Signed out. Viewing session as Guest.');
  }

  // Close dropdown on outside click
  @HostListener('document:click')
  public onDocumentClick(): void {
    if (this.isProfileMenuOpen()) {
      this.closeProfileMenu();
    }
  }
}
