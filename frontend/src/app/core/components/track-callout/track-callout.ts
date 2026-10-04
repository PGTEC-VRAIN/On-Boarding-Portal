import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiPreferencesService } from '../../services/ui-preferences';
import { Icon } from '../icon/icon';

/** Highlighted entry point to look up the status of an existing application. */
@Component({
  selector: 'app-track-callout',
  imports: [RouterLink, Icon],
  template: `
    <div class="callout">
      <span class="callout-icon"><app-icon icon="search" [size]="22" /></span>
      <span class="callout-text">
        <span class="callout-title">{{ ui.t('track.calloutTitle') }}</span>
        <span class="callout-desc">{{ ui.t('track.calloutDesc') }}</span>
      </span>
      <a class="pg-btn pg-btn--secondary pg-btn--small callout-action" routerLink="/submit" fragment="search">
        {{ ui.t('track.calloutAction') }}
        <app-icon icon="arrow-right" [size]="18" />
      </a>
    </div>`,
  styleUrl: './track-callout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackCallout {
  readonly ui = inject(UiPreferencesService);
}
