import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';
import { RegistrationStatus } from '../../types/registration-status';
import { UiPreferencesService } from '../../services/ui-preferences';

const STATUS_ICONS: Record<RegistrationStatus, IconName> = {
  [RegistrationStatus.SUBMITTED]: 'send',
  [RegistrationStatus.UNDER_REVIEW]: 'clock',
  [RegistrationStatus.ACTION_REQUIRED]: 'alert',
  [RegistrationStatus.REJECTED]: 'circle-x',
  [RegistrationStatus.ACTIVE]: 'check',
};

/** Pill showing the status of a registration request. */
@Component({
  selector: 'app-status-tag',
  imports: [Icon],
  template: `<span class="tag" [attr.data-status]="status()">
    <app-icon [name]="icon()" [size]="16" />{{ ui.t('status.' + status()) }}</span>`,
  styleUrl: './status-tag.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusTag {
  readonly status = input.required<RegistrationStatus>();
  protected readonly icon = computed(() => STATUS_ICONS[this.status()] ?? 'clock');

  constructor(readonly ui: UiPreferencesService) { }
}
