import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Fighter } from '../../models/fighter';
import { FightersService } from '../../services/fighters.service';
import { routeResource } from '../../utils/route-resource';

@Component({
  selector: 'app-fighter-details',
  imports: [DatePipe, RouterLink],
  templateUrl: './fighter-details.html',
})
export class FighterDetails {
  private fightersService = inject(FightersService);

  page = routeResource((id) => this.fightersService.getProfile(id), 'Ez a harcos nem található.');

  record(fighter: Fighter): string {
    if (fighter.wins === undefined || fighter.losses === undefined || fighter.draws === undefined) {
      return 'Mérleg nem elérhető';
    }

    const record = `${fighter.wins}–${fighter.losses}–${fighter.draws}`;

    return fighter.noContests ? `${record} · ${fighter.noContests} NC` : record;
  }

  onImageError(event: Event) {
    const image = event.target as HTMLImageElement;
    const fallback = '/images/fighters/placeholder.svg';

    if (image.getAttribute('src') !== fallback) {
      image.src = fallback;
    }
  }
}
