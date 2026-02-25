import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap, map, catchError, of, startWith } from 'rxjs';
import { useBreakpoint } from './shared/use-breakpoint';
import { BannerService } from './banner/banner.service';
import { Banner } from './banner/banner.model';
import { MobileCarouselComponent } from './banner/mobile-carousel/mobile-carousel.component';
import { BREAKPOINT_MOBILE } from '../design-system/breakpoints';

type BannerState =
  | { status: 'loading' }
  | { status: 'loaded'; banners: Banner[] }
  | { status: 'error' };

@Component({
  selector: 'app-root',
  imports: [MobileCarouselComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly bannerService = inject(BannerService);

  /** Emits to trigger a (re-)fetch. Fires once on subscription via startWith. */
  private readonly retry$ = new Subject<void>();

  private readonly state = toSignal(
    this.retry$.pipe(
      startWith(undefined),
      switchMap(() =>
        this.bannerService.getBanners().pipe(
          map((banners): BannerState => ({ status: 'loaded', banners })),
          catchError(() => of<BannerState>({ status: 'error' })),
          startWith<BannerState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as BannerState },
  );

  readonly loading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().status === 'error');
  readonly banners = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.banners : [];
  });
  readonly isMobile = useBreakpoint(BREAKPOINT_MOBILE, false);

  retryLoad(): void {
    this.retry$.next();
  }
}
