import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EventsService } from '../../services/events.service';
import { MmaEvent } from '../../models/mma-event';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-event-details',
  styleUrl: './event-details.css',
  templateUrl: './event-details.html',
})
export class EventDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private eventsService = inject(EventsService);

  event = signal<MmaEvent | null>(null);
  loading = signal(true);
  loadError = signal('');

  ngOnInit() {
    this.loadEvent();
  }

  async loadEvent() {
    this.loading.set(true);
    this.loadError.set('');
    this.event.set(null);

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id < 1) {
      this.loadError.set('Érvénytelen eseményazonosító.');
      this.loading.set(false);
      return;
    }

    try {
      const event = await firstValueFrom(this.eventsService.getEventById(id));

      this.event.set(event);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.loadError.set('Ez az esemény nem található.');
      } else {
        this.loadError.set('Nem sikerült betölteni az eseményt. Próbáld újra.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
