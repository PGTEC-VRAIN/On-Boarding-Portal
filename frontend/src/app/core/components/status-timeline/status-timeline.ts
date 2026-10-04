import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

export type TimelineState = 'done' | 'current' | 'warning' | 'error' | 'pending';

export interface TimelineItem {
  title: string;
  description: string;
  state: TimelineState;
  detail?: string;
}

/** Vertical timeline describing the progress of a registration request. */
@Component({
  selector: 'app-status-timeline',
  imports: [Icon],
  templateUrl: './status-timeline.html',
  styleUrl: './status-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusTimeline {
  readonly items = input.required<TimelineItem[]>();
}
