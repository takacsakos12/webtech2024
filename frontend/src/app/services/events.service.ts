import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { MmaEvent } from '../models/mma-event';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClient);

  getEvents() {
    return this.http.get<MmaEvent[]>('/api/events').pipe(timeout(10000));
  }
}
