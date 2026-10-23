import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Label + control + hint/error wrapper. The projected control must use
 * `id="{{ fieldId }}"` and reference `fieldId + '-hint'` / `fieldId + '-error'`
 * through aria-describedby.
 */
@Component({
  selector: 'app-form-field',
  imports: [Icon],
  template: `
    <div class="field-head">
      <label class="field-label" [attr.for]="fieldId()">
        {{ label() }}
        @if (optionalText()) { <span class="field-optional">{{ optionalText() }}</span> }
      </label>
      @if (info()) {
        <button type="button" class="field-info-btn" [attr.aria-expanded]="infoOpen()"
          [attr.aria-controls]="fieldId() + '-info'" [attr.aria-label]="infoLabel()" [title]="infoLabel()"
          (click)="infoOpen.set(!infoOpen())">
          <app-icon icon="info" [size]="16" />
        </button>
      }
    </div>
    @if (info() && infoOpen()) {
      <div class="field-info" [id]="fieldId() + '-info'" role="note">{{ info() }}</div>
    }
    <ng-content />
    @if (error()) {
      <span class="field-error" [id]="fieldId() + '-error'" role="alert">{{ error() }}</span>
    } @else if (hint()) {
      <span class="field-hint" [id]="fieldId() + '-hint'">{{ hint() }}</span>
    }`,
  styles: `
    :host { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .field-head { display: flex; align-items: center; gap: 6px; }
    .field-info-btn { display: inline-flex; align-items: center; justify-content: center; padding: 2px; border: 0; border-radius: 50%; background: transparent; color: var(--pgtec-indigo); cursor: pointer; }
    .field-info-btn:hover { background: color-mix(in srgb, var(--pgtec-indigo) 12%, transparent); }
    .field-info-btn:focus-visible { outline: 2px solid var(--pgtec-indigo); outline-offset: 2px; }
    .field-info { font-size: 13px; line-height: 1.5; color: var(--pgtec-ink); background: color-mix(in srgb, var(--pgtec-indigo) 8%, transparent); border-left: 3px solid var(--pgtec-indigo); border-radius: 6px; padding: 10px 12px; }
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
  // Explicación desplegable con un botón (i) junto a la etiqueta; vacía = sin botón.
  readonly info = input<string>('');
  readonly infoLabel = input<string>('');
  readonly infoOpen = signal(false);
}
