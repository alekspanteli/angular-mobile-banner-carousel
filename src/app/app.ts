import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, catchError, of } from 'rxjs';
import { useBreakpoint } from './shared/use-breakpoint';
import { BannerService } from './banner/banner.service';
import { Banner } from './banner/banner.model';
import { MobileCarouselComponent } from './banner/mobile-carousel/mobile-carousel.component';
import { BREAKPOINT_MOBILE } from '../design-system/breakpoints';

type BannerState =
  | { status: 'loading'; banners: Banner[] }
  | { status: 'loaded'; banners: Banner[] }
  | { status: 'error'; banners: Banner[] };

@Component({
  selector: 'app-root',
  imports: [MobileCarouselComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private bannerService = inject(BannerService);

  private readonly state = toSignal(
    this.bannerService.getBanners().pipe(
      map((banners): BannerState => ({ status: 'loaded', banners })),
      catchError(() => of<BannerState>({ status: 'error', banners: [] })),
    ),
    { initialValue: { status: 'loading', banners: [] } as BannerState },
  );

  readonly loading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().status === 'error');
  readonly banners = computed(() => this.state().banners);
  readonly isMobile = useBreakpoint(BREAKPOINT_MOBILE, false);
}
