import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { SwapiResponse } from './models/swapi.model';

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly httpClient = inject(HttpClient);
  public userIdExists(id: string): Observable<boolean> {
    return this.httpClient.get(`https://swapi.dev/api/people/${id}`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  public searchUserById(id: string) {
    return this.httpClient.get<SwapiResponse>(
      `https://swapi.dev/api/people/${id}`,
    );
  }
}
