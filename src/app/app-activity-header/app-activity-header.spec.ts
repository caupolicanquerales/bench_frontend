import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppActivityHeader } from './app-activity-header';

describe('AppActivityHeader', () => {
  let component: AppActivityHeader;
  let fixture: ComponentFixture<AppActivityHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppActivityHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(AppActivityHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('User Profile Menu and Non-redundant Identity Header', () => {
    it('should toggle profile menu on avatar click', async () => {
      expect(component.isProfileMenuOpen()).toBe(false);

      const avatarBtn = fixture.nativeElement.querySelector('.avatar-toggle-btn') as HTMLButtonElement;
      avatarBtn.click();
      fixture.detectChanges();

      expect(component.isProfileMenuOpen()).toBe(true);
      const menu = fixture.nativeElement.querySelector('.profile-dropdown-menu');
      expect(menu).toBeTruthy();
    });

    it('should display role badge, email, and view profile CTA instead of duplicate user name in dropdown header', async () => {
      component.isProfileMenuOpen.set(true);
      fixture.detectChanges();

      const roleBadge = fixture.nativeElement.querySelector('.role-badge');
      expect(roleBadge?.textContent).toContain('Pro Athlete');

      const email = fixture.nativeElement.querySelector('.user-email-text');
      expect(email?.textContent).toContain('matias@apextelemetry.io');

      const viewProfileBtn = fixture.nativeElement.querySelector('.view-profile-cta-btn');
      expect(viewProfileBtn?.textContent).toContain('View Profile');

      // Dropdown header should not have a duplicate user name element
      const redundantName = fixture.nativeElement.querySelector('.dropdown-user-name');
      expect(redundantName).toBeNull();
    });
  });

  describe('Profile Management and Team Switching', () => {
    beforeEach(() => {
      component.isProfileMenuOpen.set(true);
      fixture.detectChanges();
    });

    it('should have management options: Account Settings, Edit Details, Switch Team', () => {
      const items = fixture.nativeElement.querySelectorAll('.dropdown-item');
      const itemTexts = Array.from(items).map((el: any) => el.textContent);

      expect(itemTexts.some((t: string) => t.includes('Account Settings'))).toBe(true);
      expect(itemTexts.some((t: string) => t.includes('Edit Athlete Details'))).toBe(true);
      expect(itemTexts.some((t: string) => t.includes('Switch Team / Account'))).toBe(true);
    });

    it('should expand team switcher and allow selecting another team', () => {
      component.toggleTeamSwitcher();
      fixture.detectChanges();

      expect(component.isSwitchingTeam()).toBe(true);

      component.selectTeam('Buenos Aires Striders');
      expect(component.userTeam()).toBe('Buenos Aires Striders');
      expect(component.isSwitchingTeam()).toBe(false);
    });

    it('should close menu and set feedback on viewProfile', () => {
      component.viewProfile();
      expect(component.isProfileMenuOpen()).toBe(false);
      expect(component.activeFeedback()).toContain('Athlete Profile');
    });
  });

  describe('Preferences and Theme / Language Toggle', () => {
    it('should toggle theme between light and dark', () => {
      expect(component.isDarkMode()).toBe(false);

      component.toggleTheme();
      expect(component.isDarkMode()).toBe(true);

      component.toggleTheme();
      expect(component.isDarkMode()).toBe(false);
    });

    it('should toggle language between EN and ES', () => {
      expect(component.selectedLanguage()).toBe('EN');

      component.toggleLanguage();
      expect(component.selectedLanguage()).toBe('ES');

      component.toggleLanguage();
      expect(component.selectedLanguage()).toBe('EN');
    });
  });

  describe('Sign Out Visual Hierarchy and Flow', () => {
    it('should contain a sign out option that signs the user out', () => {
      component.isProfileMenuOpen.set(true);
      fixture.detectChanges();

      const signOutBtn = fixture.nativeElement.querySelector('.dropdown-item.signout') as HTMLButtonElement;
      expect(signOutBtn).toBeTruthy();

      signOutBtn.click();
      fixture.detectChanges();

      expect(component.isSignedIn()).toBe(false);
      expect(component.isProfileMenuOpen()).toBe(false);
    });
  });

  describe('Registration / Guest State', () => {
    beforeEach(() => {
      component.isSignedIn.set(false);
      component.isConnected.set(false);
      fixture.detectChanges();
    });

    it('should show distinct guest explorer banner and sign-in / register actions', () => {
      const guestContainer = fixture.nativeElement.querySelector('.guest-auth-container');
      expect(guestContainer).toBeTruthy();

      const guestTitle = fixture.nativeElement.querySelector('.guest-title');
      expect(guestTitle?.textContent).toContain('Guest Explorer');

      const signInBtn = fixture.nativeElement.querySelector('.btn-signin');
      const registerBtn = fixture.nativeElement.querySelector('.btn-register');
      expect(signInBtn).toBeTruthy();
      expect(registerBtn).toBeTruthy();

      // Should NOT show "Connected" status or user avatar menu
      const connectedDot = fixture.nativeElement.querySelector('.status-dot');
      expect(connectedDot).toBeNull();

      const avatarBtn = fixture.nativeElement.querySelector('.avatar-toggle-btn');
      expect(avatarBtn).toBeNull();
    });

    it('should sign in user when clicking Sign In', () => {
      const signInBtn = fixture.nativeElement.querySelector('.btn-signin') as HTMLButtonElement;
      signInBtn.click();
      fixture.detectChanges();

      expect(component.isSignedIn()).toBe(true);
      expect(component.isConnected()).toBe(true);
    });

    it('should register and sign in user when clicking Register', () => {
      const registerBtn = fixture.nativeElement.querySelector('.btn-register') as HTMLButtonElement;
      registerBtn.click();
      fixture.detectChanges();

      expect(component.isSignedIn()).toBe(true);
      expect(component.isConnected()).toBe(true);
    });
  });
});
