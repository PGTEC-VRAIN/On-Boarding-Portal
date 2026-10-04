import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Label + control + hint/error wrapper. The projected control must use
 * `id="{{ fieldId }}"` and reference `fieldId + '-hint'` / `fieldId + '-error'`
 * through aria-describedby.
 */
@Component({
  selector: 'app-form-field',
  template: `
    <label class="field-label" [attr.for]="fieldId()">
      {{ label() }}
      @if (optionalText()) { <span class="field-optional">{{ optionalText() }}</span> }
    </label>
    <ng-content />
    @if (error()) {
      <span class="field-error" [id]="fieldId() + '-error'" role="alert">{{ error() }}</span>
    } @else if (hint()) {
      <span class="field-hint" [id]="fieldId() + '-hint'">{{ hint() }}</span>
    }`,
  styles: `
    :host { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .field-label { font-size: 14px; font-weight: 600; color: var(--pgtec-ink); }
    .field-optional { font-weight: 400; color: var(--pgtec-muted); }
    .field-hint { font-size: 13px; color: var(--pgtec-muted); }
    .field-error { font-size: 13px; font-weight: 600; color: var(--pgtec-red); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormField {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly error = input<string | null>(null);
  readonly optionalText = input<string>('');
}
