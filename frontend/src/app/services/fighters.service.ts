import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, timeout } from 'rxjs';

import { Fighter } from '../models/fighter';
import { FightDetails } from '../models/fight';

@Injectable({
  providedIn: 'root',
})
export class FightersService {
  private http = inject(HttpClient);

  getProfile(id: number) {
    return forkJoin({
      fighter: this.http.get<Fighter>(`/api/fighters/${id}`),

      fights: this.http.get<FightDetails[]>('/api/fights', {
        params: { fighterId: id },
      }),
    }).pipe(timeout(10000));
  }
}
