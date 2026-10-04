import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewportScroller } from '@angular/common';
import { Router, RouterOutlet, Scroll } from '@angular/router';
import { filter } from 'rxjs';

const ANCHOR_GAP_PX = 16;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('onboarding');

  constructor() {
    const scroller = inject(ViewportScroller);

    // Keep anchored sections clear of the sticky header.
    scroller.setOffset(() => {
      const header = document.querySelector('app-toolbar');
      return [0, (header?.getBoundingClientRect().height ?? 0) + ANCHOR_GAP_PX];
    });

    // Fragments such as /submit#search select a mode instead of pointing to an element.
    // The router does not scroll to the top when there is a fragment, so do it here
    // when no element matches it (back/forward navigation keeps its restored position).
    inject(Router).events
      .pipe(filter((event): event is Scroll => event instanceof Scroll), takeUntilDestroyed())
      .subscribe(event => {
        if (event.anchor && !event.position && !document.getElementById(event.anchor)) {
          // Instant: a new page must not animate from the previous scroll position.
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      });
  }
}
