import { Component, ElementRef, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UploadFile } from '../upload-file/upload-file';
import { OnBoardingService, RegistrationInfo } from '../../services/onboarding.service';
import { NotificationService } from '../../services/notification';
import { ServerConfigService } from '../../services/server-config';
import { UiPreferencesService } from '../../services/ui-preferences';
import { FormField } from '../form-field/form-field';
import { Icon } from '../icon/icon';

export const REGISTRATION_FORM_STEPS = 3;

@Component({
  selector: 'app-registration-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UploadFile,
    FormField,
    Icon
  ],
  templateUrl: './registration-form.html',
  styleUrl: './registration-form.scss',
})
export class RegistrationForm {

  readonly stepChange = output<number>();
  readonly submitted = output<string>();

  readonly step = signal(0);
  isProcessing = signal<boolean>(false);
  registrationId?: string;

  readonly maxFileSizeMB = 5;
  pdfDocumentUrl: string;
  didCreationEnabled: boolean;
  contactForm: FormGroup;
  orgForm: FormGroup;
  legalForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private onBoardingService: OnBoardingService,
    private notification: NotificationService,
    private host: ElementRef<HTMLElement>,
    config: ServerConfigService,
    readonly ui: UiPreferencesService,
  ) {
    this.pdfDocumentUrl = config.getProperty('documentToSignUrl');
    this.didCreationEnabled = config.getProperty('didCreationEnabled');

    const didValidators = [Validators.pattern(/^did:[a-z0-9]+:[a-zA-Z0-9\.\-_%:]+$/)];
    if (!this.didCreationEnabled) {
      didValidators.push(Validators.required);
    }

    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      did: ['', didValidators]
    });

    this.orgForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      taxId: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      postCode: ['', Validators.required],
      country: ['', Validators.required]
    });

    // The acceptance checkboxes are a client-side confirmation only: they are not sent to the API.
    this.legalForm = this.fb.group({
      file: [null, Validators.required],
      acceptGovernance: [false, Validators.requiredTrue],
      acceptRepresentation: [false, Validators.requiredTrue]
    });
  }

  private get forms(): FormGroup[] {
    return [this.orgForm, this.contactForm, this.legalForm];
  }

  errorFor(control: AbstractControl | null): string | null {
    if (!control || !control.invalid || !control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return this.ui.t('form.required');
    }
    if (control.hasError('minlength')) {
      return this.ui.replace('form.minLength', { min: control.getError('minlength').requiredLength });
    }
    if (control.hasError('email')) {
      return this.ui.t('form.invalidEmail');
    }
    if (control.hasError('pattern')) {
      return this.ui.t('form.invalidDid');
    }
    return null;
  }

  describedBy(id: string, control: AbstractControl | null, hasHint = false): string | null {
    if (this.errorFor(control)) {
      return `${id}-error`;
    }
    return hasHint ? `${id}-hint` : null;
  }

  next(): void {
    const form = this.forms[this.step()];
    if (form.invalid) {
      form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    this.goTo(this.step() + 1);
  }

  back(): void {
    this.goTo(this.step() - 1);
  }

  private goTo(step: number): void {
    const target = Math.max(0, Math.min(step, REGISTRATION_FORM_STEPS - 1));
    this.step.set(target);
    this.stepChange.emit(target);
    window.scrollTo({ top: 0 });
  }

  private focusFirstInvalid(): void {
    setTimeout(() => {
      const invalid = this.host.nativeElement.querySelector<HTMLElement>('input.ng-invalid');
      invalid?.focus();
    });
  }

  onFileSelected(files: File[]): void {
    const control = this.legalForm.get('file');
    if (files && files.length > 0) {
      this.legalForm.patchValue({ file: files[0] });
      control?.markAsDirty();
    } else {
      this.legalForm.patchValue({ file: null });
    }
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  submitRegistration(): void {
    if (this.legalForm.invalid) {
      this.legalForm.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    if (this.contactForm.valid && this.orgForm.valid && this.legalForm.valid) {
      this.isProcessing.set(true);

      const data = { ...this.contactForm.value, ...this.orgForm.value }
      this.onBoardingService.submitRegistration(
        data as RegistrationInfo,
        this.legalForm.get('file')!.value as File
      ).subscribe({
        next: (response) => {
          this.registrationId = response.id;
          this.isProcessing.set(false);
          this.submitted.emit(response.id);
        },
        error: (err) => {
          this.isProcessing.set(false);
          this.notification.error(this.ui.t('form.submitError'));
          console.error('Submission Error:', err);
        }
      });
    }
  }
}
