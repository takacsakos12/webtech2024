import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EventsService } from '../../services/events.service';
import { MmaEvent } from '../../models/mma-event';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private eventsService = inject(EventsService);
  private destroyRef = inject(DestroyRef);

  events = signal<MmaEvent[]>([]);
  loading = signal(true);
  error = signal('');

  private today = (() => {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
  })();

  upcoming = computed(() =>
    this.events()
      .filter((event) => event.date >= this.today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
      .slice(0, 3),
  );

  featured = computed(() => this.upcoming()[0] ?? null);

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.error.set('');

    this.eventsService
      .getEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.loading.set(false);
        },
        error: () => {
          this.events.set([]);
          this.error.set('Az eseményeket most nem sikerült betölteni.');
          this.loading.set(false);
        },
      });
  }
}
