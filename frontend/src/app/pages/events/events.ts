import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { EventsService } from '../../services/events.service';
import { MmaEvent } from '../../models/mma-event';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-events',
  imports: [DatePipe, RouterLink],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events implements OnInit {
  private eventsService = inject(EventsService);

  events = signal<MmaEvent[]>([]);
  loading = signal(true);
  loadError = signal('');

  search = signal('');
  selectedOrganization = signal('');
  startDate = signal('');
  endDate = signal('');
  sortOrder = signal('asc');

  organizations = computed(() => {
    const organizations = this.events().map((event) => event.organization);

    return [...new Set(organizations)].sort();
  });

  dateRangeError = computed(() => {
    if (this.startDate() && this.endDate() && this.startDate() > this.endDate()) {
      return 'A kezdődátum nem lehet későbbi a végdátumnál.';
    }

    return '';
  });

  filteredEvents = computed(() => {
    if (this.dateRangeError()) {
      return [];
    }

    const query = this.search().trim().toLocaleLowerCase('hu');
    const organization = this.selectedOrganization();
    const from = this.startDate();
    const to = this.endDate();

    const result = this.events().filter((event) => {
      const matchesText =
        event.name.toLocaleLowerCase('hu').includes(query) ||
        event.location.toLocaleLowerCase('hu').includes(query);

      const matchesOrganization = organization === '' || event.organization === organization;

      const matchesFrom = from === '' || event.date >= from;

      const matchesTo = to === '' || event.date <= to;

      return matchesText && matchesOrganization && matchesFrom && matchesTo;
    });

    // A filter új tömböt készít, így az eredeti sorrend megmarad.
    return result.sort((a, b) => {
      if (this.sortOrder() === 'desc') {
        return b.date.localeCompare(a.date);
      }

      return a.date.localeCompare(b.date);
    });
  });

  ngOnInit() {
    this.loadEvents();
  }

  async loadEvents() {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const events = await firstValueFrom(this.eventsService.getEvents());

      this.events.set(events);
    } catch {
      this.loadError.set('Nem sikerült betölteni az eseményeket. Próbáld újra.');
    } finally {
      this.loading.set(false);
    }
  }

  clearFilters() {
    this.search.set('');
    this.selectedOrganization.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.sortOrder.set('asc');
  }
}
