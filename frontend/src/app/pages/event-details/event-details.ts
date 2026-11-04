import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { EventsService } from '../../services/events.service';
import { EventWithFights, Fight } from '../../models/fight';
import { Fighter } from '../../models/fighter';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-event-details',
  styleUrl: './event-details.css',
  templateUrl: './event-details.html',
})
export class EventDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private eventsService = inject(EventsService);
  private destroyRef = inject(DestroyRef);

  // Egy korábbi lekérés válasza ne írja felül az új eseményt.
  private loadId = 0;

  event = signal<EventWithFights | null>(null);
  loading = signal(true);
  loadError = signal('');

  ngOnInit() {
    this.destroyRef.onDestroy(() => {
      this.loadId++;
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      void this.loadEvent();
    });
  }

  async loadEvent() {
    const currentLoad = ++this.loadId;

    this.loading.set(true);
    this.loadError.set('');
    this.event.set(null);

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isSafeInteger(id) || id < 1) {
      this.loadError.set('Érvénytelen eseményazonosító.');
      this.loading.set(false);
      return;
    }

    try {
      const event = await firstValueFrom(this.eventsService.getEventWithFights(id));

      if (currentLoad === this.loadId) {
        this.event.set(event);
      }
    } catch (error) {
      if (currentLoad !== this.loadId) {
        return;
      }

      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.loadError.set('Ez az esemény nem található.');
      } else {
        this.loadError.set('Nem sikerült betölteni az eseményt. Próbáld újra.');
      }
    } finally {
      if (currentLoad === this.loadId) {
        this.loading.set(false);
      }
    }
  }

  fighterRecord(fighter: Fighter): string {
    if (fighter.wins === undefined || fighter.losses === undefined || fighter.draws === undefined) {
      return 'Mérleg nem elérhető';
    }

    const record = `${fighter.wins}–${fighter.losses}–${fighter.draws}`;

    return fighter.noContests ? `${record} · ${fighter.noContests} NC` : record;
  }

  statusLabel(status: Fight['status']): string {
    switch (status) {
      case 'completed':
        return 'Befejezett';
      case 'cancelled':
        return 'Törölve';
      default:
        return 'Tervezett';
    }
  }

  resultLabel(fight: Fight): string {
    if (!fight.result) {
      return '';
    }

    if (fight.result.outcome === 'draw') {
      return 'Döntetlen';
    }

    if (fight.result.outcome === 'no-contest') {
      return 'No contest';
    }

    const winner = [fight.redCorner, fight.blueCorner].find(
      (fighter) => fighter != null && fighter.id === fight.result?.winnerId,
    );

    return winner ? `Győztes: ${winner.name}` : 'A győztes adatai nem elérhetők';
  }

  onImageError(event: Event) {
    const image = event.target as HTMLImageElement;
    const fallback = '/images/fighters/placeholder.svg';

    if (image.getAttribute('src') !== fallback) {
      image.src = fallback;
    }
  }
}
