import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

interface PageState<T> {
  loading: boolean;
  data: T | null;
  error: string;
}

export function routeResource<T>(loader: (id: number) => Observable<T>, notFoundMessage: string) {
  const route = inject(ActivatedRoute);
  const reload = new Subject<void>();

  const initialState: PageState<T> = {
    loading: true,
    data: null,
    error: '',
  };

  const state = toSignal(
    combineLatest([route.paramMap, reload.pipe(startWith(undefined))]).pipe(
      switchMap(([params]) => {
        const id = Number(params.get('id'));

        if (!Number.isSafeInteger(id) || id < 1) {
          return of<PageState<T>>({
            loading: false,
            data: null,
            error: 'Érvénytelen azonosító.',
          });
        }

        return loader(id).pipe(
          map((data): PageState<T> => ({
            loading: false,
            data,
            error: '',
          })),

          catchError((error: unknown) =>
            of<PageState<T>>({
              loading: false,
              data: null,
              error:
                error instanceof HttpErrorResponse && error.status === 404
                  ? notFoundMessage
                  : 'Nem sikerült betölteni az adatokat. Próbáld újra.',
            }),
          ),

          startWith(initialState),
        );
      }),
    ),
    { initialValue: initialState },
  );

  return {
    state,
    reload: () => reload.next(),
  };
}
