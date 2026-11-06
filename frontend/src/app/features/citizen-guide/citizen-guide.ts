import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiPreferencesService } from '../../core/services/ui-preferences';
import { Toolbar } from '../../core/components/toolbar/toolbar';
import { SiteFooter } from '../../core/components/site-footer/site-footer';
import { Icon } from '../../core/components/icon/icon';
import { LISSI_ANDROID_URL, LISSI_IOS_URL } from '../../core/constants/lissi';

// Guia para el consumidor ciudadano: solicitar el alta, revisar el correo y guardar la
// credencial en la wallet (Lissi) para acceder a un servicio (p. ej. TETIS).
@Component({
  selector: 'app-citizen-guide',
  imports: [RouterLink, Toolbar, SiteFooter, Icon],
  templateUrl: './citizen-guide.html',
  styleUrl: './citizen-guide.scss',
})
export class CitizenGuide {
  readonly ui = inject(UiPreferencesService);
  readonly lissiIos = LISSI_IOS_URL;
  readonly lissiAndroid = LISSI_ANDROID_URL;
}
