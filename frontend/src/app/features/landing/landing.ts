import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Toolbar } from "../../core/components/toolbar/toolbar";
import { UiPreferencesService } from '../../core/services/ui-preferences';
import { SiteFooter } from '../../core/components/site-footer/site-footer';
import { ServerConfigService } from '../../core/services/server-config';
import { Icon, IconName } from '../../core/components/icon/icon';
import { TrackCallout } from '../../core/components/track-callout/track-callout';

interface LandingItem {
  key: string;
  icon: IconName;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink,
    Toolbar,
    SiteFooter,
    Icon,
    TrackCallout
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class Landing {

  readonly documentUrl: string;

  readonly steps: (LandingItem & { color: string })[] = [
    { key: 'step1', icon: 'building', color: 'var(--pgtec-indigo)' },
    { key: 'step2', icon: 'pen', color: 'var(--pgtec-teal)' },
    { key: 'step3', icon: 'shield-check', color: 'var(--pgtec-orange-strong)' },
    { key: 'step4', icon: 'key', color: 'var(--pgtec-green)' },
  ];

  readonly requirements: (LandingItem & { descKey: string })[];

  constructor(
    config: ServerConfigService,
    readonly ui: UiPreferencesService
  ) {
    this.documentUrl = config.getProperty('documentToSignUrl') || '';
    const didOptional = config.getProperty('didCreationEnabled');
    this.requirements = [
      { key: 'reqEntity', icon: 'building', descKey: 'landing.reqEntityDesc' },
      { key: 'reqContact', icon: 'mail', descKey: 'landing.reqContactDesc' },
      { key: 'reqSign', icon: 'pen', descKey: 'landing.reqSignDesc' },
      {
        key: 'reqDid',
        icon: 'id-card',
        descKey: didOptional ? 'landing.reqDidDescOptional' : 'landing.reqDidDescRequired'
      },
    ];
  }
}
