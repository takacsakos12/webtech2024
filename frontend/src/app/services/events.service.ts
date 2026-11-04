import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';

import { MmaEvent } from '../models/mma-event';
import { EventWithFights } from '../models/fight';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClient);

  getEvents() {
    return this.http.get<MmaEvent[]>('/api/events').pipe(timeout(10000));
  }

  getEventById(id: number) {
    return this.http.get<MmaEvent>(`/api/events/${id}`).pipe(timeout(10000));
  }

  getEventWithFights(id: number) {
    return this.http.get<EventWithFights>(`/api/events/${id}/fights`).pipe(timeout(10000));
  }
}
