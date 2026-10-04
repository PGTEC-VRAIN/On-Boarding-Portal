import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { UiPreferencesService } from '../../services/ui-preferences';

export interface WizardStep {
  label: string;
  description: string;
}

/**
 * Vertical progress indicator. Steps before `current` are completed, the
 * `current` one is marked with aria-current="step" and the rest are pending.
 */
@Component({
  selector: 'app-step-indicator',
  imports: [Icon],
  templateUrl: './step-indicator.html',
  styleUrl: './step-indicator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepIndicator {
  readonly heading = input<string>('');
  readonly steps = input.required<WizardStep[]>();
  readonly current = input<number>(0);

  constructor(readonly ui: UiPreferencesService) { }
}
