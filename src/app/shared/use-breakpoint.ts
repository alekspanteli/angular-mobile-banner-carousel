import { inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Returns a signal that reflects whether the given media query matches.
 * @param query Media query string or array of queries
 * @param initialValue Initial value for the signal (default: false)
 */
export function useBreakpoint(query: string | string[], initialValue = false) {
  const breakpointObserver = inject(BreakpointObserver);
  return toSignal(
    breakpointObserver.observe(query).pipe(
      // Map to true/false if any query matches
      (source: Observable<any>) => source.pipe(
        map((result: any) => result.matches)
      )
    ),
    { initialValue }
  );
}
