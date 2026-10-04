import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OnBoardingService } from '../../core/services/onboarding.service';
import { RegistrationDetails } from '../../core/components/registration-details/registration-details';
import { NotificationService } from '../../core/services/notification';
import { Toolbar } from '../../core/components/toolbar/toolbar';
import { RegistrationForm } from '../../core/components/registration-form/registration-form';
import { UiPreferencesService } from '../../core/services/ui-preferences';
import { SiteFooter } from '../../core/components/site-footer/site-footer';
import { StepIndicator, WizardStep } from '../../core/components/step-indicator/step-indicator';
import { ApplicationStatus } from '../../core/components/application-status/application-status';
import { CopyInput } from '../../core/components/copy-input/copy-input';
import { Icon } from '../../core/components/icon/icon';
import { TrackCallout } from '../../core/components/track-callout/track-callout';
import { Registration } from '../../core/types/registration';
import { RegistrationStatus } from '../../core/types/registration-status';

type SubmitMode = 'register' | 'search';

const STATUS_STEP = 3;
const STEP_HEADINGS = ['org', 'contact', 'contract', 'status'];

@Component({
  selector: 'app-submit',
  imports: [
    FormsModule,
    RouterLink,
    Toolbar,
    SiteFooter,
    RegistrationDetails,
    RegistrationForm,
    StepIndicator,
    ApplicationStatus,
    CopyInput,
    Icon,
    TrackCallout
  ],
  templateUrl: './submit.html',
  styleUrl: './submit.scss',
})
export class Submit {
  private readonly notification = inject(NotificationService);
  private readonly onBoardingService = inject(OnBoardingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly ui = inject(UiPreferencesService);

  trackingId = '';
  readonly isProcessing = signal(false);
  readonly mode = signal<SubmitMode>('register');
  readonly formStep = signal(0);
  readonly trackedRegistration = signal<Registration | null>(null);
  readonly submittedId = signal<string | null>(null);
  readonly _editing = signal(false);
  private lastSearchedId: string | null = null;

  readonly currentStep = computed(() => {
    if (this.mode() === 'register') {
      return this.formStep();
    }
    // An active registration has completed every step.
    return this.trackedRegistration()?.status === RegistrationStatus.ACTIVE ? STATUS_STEP + 1 : STATUS_STEP;
  });

  readonly heading = computed(() => STEP_HEADINGS[Math.min(this.currentStep(), STATUS_STEP)]);

  readonly steps = computed<WizardStep[]>(() => [1, 2, 3, 4].map(n => ({
    label: this.ui.t(`wizard.step${n}`),
    description: this.ui.t(`wizard.step${n}Desc`),
  })));

  constructor() {
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(fragment => {
      this.mode.set(fragment === 'search' ? 'search' : 'register');
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.lastSearchedId = null;
        this.submittedId.set(null);
        this.trackedRegistration.set(null);
        return;
      }
      if (id !== this.lastSearchedId) {
        this.trackingId = id;
        this.search(id);
      }
    });
  }

  onSearch(): void {
    const id = this.trackingId.trim();
    if (!id) return;

    if (id === this.lastSearchedId) {
      this.search(id);
    } else {
      this.setIdQueryParam(id);
    }
  }

  onSubmitted(id: string): void {
    this.submittedId.set(id);
    this.setIdQueryParam(id);
  }

  lookUpAnother(): void {
    this.submittedId.set(null);
    this.trackingId = '';
    this.setIdQueryParam();
  }

  private search(id: string): void {
    this.lastSearchedId = id;
    this.isProcessing.set(true);
    this.trackedRegistration.set(null);
    this.onBoardingService.getRegistration(id).subscribe({
      next: (registration) => {
        this.isProcessing.set(false);
        console.debug("Registration", registration);
        this.trackedRegistration.set(registration);
      },
      error: (error) => {
        console.error("Error getting registration", error);
        this.isProcessing.set(false);
        this.notification.error(this.ui.replace('submit.notFound', { id }));
        if (!this.submittedId()) {
          this.setIdQueryParam();
        }
      }
    })
  }

  private setIdQueryParam(id?: string) {
    const query = id ? { id } : null
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: query,
      queryParamsHandling: 'replace',
      fragment: 'search'
    });
  }
}
