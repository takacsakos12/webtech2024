import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DEMO_EVENTS } from './events.data';
@Component({
  selector: 'app-events',
  imports: [DatePipe],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {
  events = signal(DEMO_EVENTS);

  search = signal('');
  selectedOrganization = signal('');
  startDate = signal('');
  endDate = signal('');
  sortOrder = signal('asc');

  organizations = computed(() => {
    return [...new Set(this.events().map((event) => event.organization))].sort();
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

    // A filter új tömböt készít, az eredeti sorrend megmarad.
    return result.sort((a, b) => {
      if (this.sortOrder() === 'desc') {
        return b.date.localeCompare(a.date);
      }

      return a.date.localeCompare(b.date);
    });
  });

  clearFilters() {
    this.search.set('');
    this.selectedOrganization.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.sortOrder.set('asc');
  }
}
