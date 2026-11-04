import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { FightDetails as FightData } from '../../models/fight';
import { FightsService } from '../../services/fights.service';
import { routeResource } from '../../utils/route-resource';

@Component({
  selector: 'app-fight-details',
  imports: [DatePipe, RouterLink],
  templateUrl: './fight-details.html',
})
export class FightDetails {
  private fightsService = inject(FightsService);

  page = routeResource((id) => this.fightsService.getById(id), 'Ez a meccs nem található.');

  statusLabel(status: FightData['status']): string {
    switch (status) {
      case 'completed':
        return 'Befejezett';
      case 'cancelled':
        return 'Törölve';
      default:
        return 'Tervezett';
    }
  }

  resultLabel(fight: FightData): string {
    if (!fight.result) {
      return 'Eredmény még nem elérhető.';
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

    return winner ? `Győztes: ${winner.name}` : 'A győztes adatai nem elérhetők.';
  }
}
