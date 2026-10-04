import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiPreferencesService } from '../../services/ui-preferences';
import { ServerConfigService } from '../../services/server-config';
import { AuthService } from '../../services/auth';
import { Icon } from '../icon/icon';

@Component({
    selector: 'app-site-footer',
    standalone: true,
    imports: [RouterLink, Icon],
    templateUrl: './site-footer.html',
    styleUrl: './site-footer.scss'
})
export class SiteFooter {
    readonly year = new Date().getFullYear();
    readonly documentUrl: string;

    constructor(
        readonly ui: UiPreferencesService,
        config: ServerConfigService,
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {
        this.documentUrl = config.getProperty('documentToSignUrl') || '';
    }

    // Entry point to the admin area, kept low-key on purpose: it is only for data space operators.
    onAdminAccess(): void {
        if (this.authService.isLoggedIn) {
            this.router.navigate(['/admin']);
        } else {
            this.authService.login();
        }
    }
}
