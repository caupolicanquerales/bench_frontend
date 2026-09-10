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
  protected activityTitle = signal('Ciudad de Buenos Aires Carrera');
  protected isEditingTitle = signal(false);
  protected editTitleDraft = signal('');
  protected activitySubtitle = signal('Running • Sunday Morning Session');

  // Authentication state
  protected isSignedIn = signal(true);
  protected userName = signal('Matías Albornoz');
  protected isConnected = signal(true);
  protected userAvatar = signal(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  );

  // Profile dropdown menu state
  protected isProfileMenuOpen = signal(false);

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
  protected toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen.update((open) => !open);
  }

  protected closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  // Auth toggle simulation
  protected signIn(): void {
    this.isSignedIn.set(true);
    this.isConnected.set(true);
  }

  protected signOut(): void {
    this.isSignedIn.set(false);
    this.isProfileMenuOpen.set(false);
  }

  // Close dropdown on outside click
  @HostListener('document:click')
  protected onDocumentClick(): void {
    if (this.isProfileMenuOpen()) {
      this.closeProfileMenu();
    }
  }
}
