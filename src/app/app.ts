import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { useBreakpoint } from './shared/use-breakpoint';
import { BannerService } from './banner/banner.service';
import { MobileCarouselComponent } from './banner/mobile-carousel/mobile-carousel.component';
import { BREAKPOINT_MOBILE } from '../design-system/breakpoints';

// ...existing code...

@Component({
  selector: 'app-root',
  imports: [MobileCarouselComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private bannerService = inject(BannerService);

  readonly banners = toSignal(this.bannerService.getBanners(), { initialValue: [] });
  readonly loading = computed(() => this.banners().length === 0);
  readonly isMobile = useBreakpoint(BREAKPOINT_MOBILE, false);
}
