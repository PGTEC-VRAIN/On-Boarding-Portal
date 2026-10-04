import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiPreferencesService } from '../../services/ui-preferences';
import { ServerConfigService } from '../../services/server-config';

@Component({
    selector: 'app-site-footer',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './site-footer.html',
    styleUrl: './site-footer.scss'
})
export class SiteFooter {
    readonly year = new Date().getFullYear();
    readonly documentUrl: string;

    constructor(readonly ui: UiPreferencesService, config: ServerConfigService) {
        this.documentUrl = config.getProperty('documentToSignUrl') || '';
    }
}
