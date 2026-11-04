import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { FightDetails } from '../models/fight';

@Injectable({
  providedIn: 'root',
})
export class FightsService {
  private http = inject(HttpClient);

  getById(id: number) {
    return this.http.get<FightDetails>(`/api/fights/${id}`).pipe(timeout(10000));
  }
}
