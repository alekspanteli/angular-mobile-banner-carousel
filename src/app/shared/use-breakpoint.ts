import { inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export function useBreakpoint(query: string | string[], initialValue = false) {
  const breakpointObserver = inject(BreakpointObserver, { optional: true });
  if (!breakpointObserver) {
    throw new Error('useBreakpoint requires BreakpointObserver. Provide it in your app config.');
  }
  // MCP: toSignal handles teardown automatically, so no manual cleanup needed.
  return toSignal(
    breakpointObserver.observe(query).pipe(map(result => result.matches)),
    { initialValue },
  );
}
