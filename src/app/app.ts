import { Component, inject, signal } from '@angular/core';
import { useBreakpoint } from './shared/use-breakpoint';
import { Banner } from './banner/banner.model';
import { BannerService } from './banner/banner.service';
import { MobileCarouselComponent } from './banner/mobile-carousel/mobile-carousel.component';
import { BREAKPOINT_MOBILE } from '../design-system/breakpoints';

@Component({
  selector: 'app-root',
  imports: [MobileCarouselComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})

export class App {
  banners = signal<Banner[]>([]);
  loading = signal(true);
  isMobile = useBreakpoint(BREAKPOINT_MOBILE, false);

  private bannerService = inject(BannerService);

  constructor() {
    this.bannerService.getBanners().subscribe(banners => {
      this.banners.set(banners);
      this.loading.set(false);
    });
  }
}
