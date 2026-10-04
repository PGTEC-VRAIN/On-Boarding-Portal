import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiPreferencesService } from '../../services/ui-preferences';
import { Icon } from '../icon/icon';

/**
 * Link to the data space Marketplace, set apart from the onboarding flow on purpose:
 * the Marketplace is an independent service, not a step of joining.
 */
@Component({
  selector: 'app-marketplace-callout',
  imports: [Icon],
  template: `
    <p class="callout-eyebrow"><span>{{ ui.t('market.eyebrow') }}</span></p>
    <a class="callout" [href]="ui.marketplaceUrl" target="_blank" rel="noopener noreferrer">
      <span class="callout-icon"><app-icon icon="store" [size]="20" /></span>
      <span class="callout-text">
        <span class="callout-title">{{ ui.t('market.title') }}</span>
        <span class="callout-desc">{{ ui.t('market.desc') }}</span>
      </span>
      <app-icon class="callout-arrow" icon="external" [size]="18" />
      <span class="pg-visually-hidden">{{ ui.t('common.newTab') }}</span>
    </a>`,
  styleUrl: './marketplace-callout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceCallout {
  readonly ui = inject(UiPreferencesService);
}
