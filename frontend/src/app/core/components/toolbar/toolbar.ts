import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { UiPreferencesService } from '../../services/ui-preferences';
import { ServerConfigService } from '../../services/server-config';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toolbar',
  imports: [
    RouterLink,
    MatIconModule,
    MatMenuModule,
    Icon
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {

  @Input() showAdminLogin = true;
  @Input() showUserMenu = false;
  user: any;
  // The Governance Framework is Annex I of the accession agreement.
  readonly governanceUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    config: ServerConfigService,
    readonly ui: UiPreferencesService
  ) {
    this.user = this.authService.getUser();
    this.governanceUrl = config.getProperty('documentToSignUrl') || '';
  }

  isLogged() {
    return this.authService.isLoggedIn;
  }

  onAdminLogin() {
    if (this.authService.isLoggedIn) {
      this.goAdminDashboard();
    } else {
      this.authService.login();
    }
  }

  goAdminDashboard() {
    this.router.navigate(['/admin'])
  }

  goLanding(): void {
    this.router.navigate(['/'])
  }

  onLogout(): void {
    this.authService.signOut();
  }

  openExternal(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
