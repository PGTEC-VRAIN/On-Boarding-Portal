import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Registration } from '../../types/registration';
import { RegistrationStatus } from '../../types/registration-status';
import { UiPreferencesService } from '../../services/ui-preferences';
import { ServerConfigService } from '../../services/server-config';
import { StatusTag } from '../status-tag/status-tag';
import { StatusTimeline, TimelineItem, TimelineState } from '../status-timeline/status-timeline';
import { Icon } from '../icon/icon';

/** Status card (headline, tag and timeline) plus the "in the meantime" resources. */
@Component({
  selector: 'app-application-status',
  imports: [StatusTag, StatusTimeline, Icon],
  providers: [DatePipe],
  templateUrl: './application-status.html',
  styleUrl: './application-status.scss',
})
export class ApplicationStatus {
  private readonly datePipe = inject(DatePipe);
  readonly ui = inject(UiPreferencesService);
  readonly documentUrl = inject(ServerConfigService).getProperty('documentToSignUrl') || '';

  readonly registration = input.required<Registration>();

  readonly note = computed(() => {
    const status = this.registration().status;
    const specific = `track.note.${status}`;
    const text = this.ui.t(specific);
    return text === specific ? this.ui.t('track.note.default') : text;
  });

  readonly timeline = computed<TimelineItem[]>(() => {
    const registration = this.registration();
    const status = registration.status;
    const filesCount = registration.files?.length ?? 0;
    const isActive = status === RegistrationStatus.ACTIVE;
    const reason = registration.reason ? this.ui.replace('timeline.reason', { reason: registration.reason }) : undefined;

    let verificationState: TimelineState = 'current';
    let verificationDesc = this.ui.t('timeline.verificationPending');
    let verificationDetail: string | undefined;
    if (status === RegistrationStatus.ACTION_REQUIRED) {
      verificationState = 'warning';
      verificationDesc = this.ui.t('timeline.verificationAction');
      verificationDetail = reason;
    } else if (status === RegistrationStatus.REJECTED) {
      verificationState = 'error';
      verificationDesc = this.ui.t('timeline.verificationRejected');
      verificationDetail = reason;
    } else if (isActive) {
      verificationState = 'done';
      verificationDesc = this.ui.t('timeline.verificationDone');
    }

    return [
      {
        title: this.ui.t('timeline.sent'),
        description: this.ui.replace('timeline.sentDesc', {
          date: this.datePipe.transform(registration.createdAt, 'dd/MM/yyyy HH:mm') ?? '',
        }),
        state: 'done',
      },
      {
        title: this.ui.t('timeline.contract'),
        description: filesCount > 0
          ? this.ui.replace('timeline.contractDesc', { count: filesCount })
          : this.ui.t('timeline.contractMissing'),
        state: filesCount > 0 ? 'done' : 'warning',
      },
      {
        title: this.ui.t('timeline.verification'),
        description: verificationDesc,
        detail: verificationDetail,
        state: verificationState,
      },
      {
        title: this.ui.t('timeline.credentials'),
        description: this.ui.t(isActive ? 'timeline.credentialsDone' : 'timeline.credentialsPending'),
        state: isActive ? 'done' : 'pending',
      },
      {
        title: this.ui.t('timeline.connection'),
        description: this.ui.t('timeline.connectionDesc'),
        state: isActive ? 'current' : 'pending',
      },
    ];
  });
}
