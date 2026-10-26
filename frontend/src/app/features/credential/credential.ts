import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OnBoardingService } from '../../core/services/onboarding.service';
import { UiPreferencesService } from '../../core/services/ui-preferences';
import { Toolbar } from '../../core/components/toolbar/toolbar';
import { SiteFooter } from '../../core/components/site-footer/site-footer';
import { Icon } from '../../core/components/icon/icon';

type CredentialError = 'invalid' | 'tooMany' | 'server';

// Pagina del enlace del correo de ciudadania: cada vez que se abre, o se pulsa "Generar nuevo
// codigo", pide una oferta de credencial nueva (los codigos caducan pronto) y muestra su QR.
@Component({
  selector: 'app-citizen-credential',
  imports: [RouterLink, Toolbar, SiteFooter, Icon],
  templateUrl: './credential.html',
  styleUrl: './credential.scss',
})
export class CitizenCredential {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OnBoardingService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  readonly ui = inject(UiPreferencesService);

  private token = '';
  readonly loading = signal(true);
  readonly error = signal<CredentialError | null>(null);
  readonly name = signal('');
  readonly qr = signal('');
  // URI openid-credential-offer:// del backend: Angular bloquearia el esquema, asi que se marca como segura.
  readonly walletLink = signal<SafeUrl | null>(null);
  readonly generation = signal(0);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.token = params.get('t') ?? '';
      this.load();
    });
  }

  load(): void {
    if (!this.token) {
      this.error.set('invalid');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.service.getCitizenCredential(this.token).subscribe({
      next: ({ name, uri, qr }) => {
        this.name.set(name);
        this.qr.set(qr);
        this.walletLink.set(this.sanitizer.bypassSecurityTrustUrl(uri));
        this.generation.update(n => n + 1);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 404 ? 'invalid' : err.status === 429 ? 'tooMany' : 'server');
        this.loading.set(false);
      },
    });
  }
}
