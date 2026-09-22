import { Component, HostListener, effect, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth-service';
import { UploadButton } from '../shared/components/upload-button/upload-button';

@Component({
  imports: [FormsModule, UploadButton],
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

  // File import action
  public fileImported = output<File>();
  public isImporting = signal(false);

  // Authentication & User Profile state (bound to AuthService)
  public isSignedIn = signal<boolean>(true);
  public isConnected = signal<boolean>(true);
  public userName = signal<string>('Matías Albornoz');
  public userEmail = signal<string>('matias@apextelemetry.io');
  public userRole = signal<string>('Pro Athlete');
  public userTeam = signal<string>('Apex Endurance Team');
  public userAvatar = signal<string>(
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

  constructor(private authService: AuthService) {
    if (typeof this.authService.currentUser === 'function') {
      effect(() => {
        const user = this.authService.currentUser();
        const signedIn = typeof this.authService.isSignedIn === 'function'
          ? this.authService.isSignedIn()
          : this.authService.isLogged;
        this.isSignedIn.set(signedIn);
        this.isConnected.set(
          typeof this.authService.isConnected === 'function'
            ? this.authService.isConnected()
            : this.authService.isLogged
        );

        if (user) {
          this.userName.set(user.fullName || user.username || 'Athlete');
          this.userEmail.set(user.email || '');
          if (user.roles && user.roles.length > 0) {
            const formattedRole = user.roles[0]
              .replace(/^ROLE_/, '')
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ');
            this.userRole.set(formattedRole);
          }
          if (user.avatarUrl) {
            this.userAvatar.set(user.avatarUrl);
          }
        } else if (!signedIn) {
          this.userName.set('Guest');
          this.userEmail.set('');
          this.userRole.set('Guest');
        }
      });
    }
  }

  // Upload / Import handlers
  public onFileSelected(file: File): void {
    this.isImporting.set(true);
    this.fileImported.emit(file);
    this.showFeedback(`Importing ${file.name}...`);

    // In a real flow, the parent/service completes the import; provide simulated completion feedback
    setTimeout(() => {
      this.isImporting.set(false);
      this.showFeedback(`Activity "${file.name}" imported successfully`);
    }, 2000);
  }

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
    this.authService.login();
  }

  public register(): void {
    this.isSignedIn.set(true);
    this.isConnected.set(true);
    this.authService.register();
  }

  public signOut(): void {
    this.isSignedIn.set(false);
    this.isConnected.set(false);
    this.isProfileMenuOpen.set(false);
    this.isSwitchingTeam.set(false);
    this.authService.logout();
  }

  // Close dropdown on outside click
  @HostListener('document:click')
  public onDocumentClick(): void {
    if (this.isProfileMenuOpen()) {
      this.closeProfileMenu();
    }
  }
}
