import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Banner } from './banner/banner.model';
import { BannerService } from './banner/banner.service';
import { MobileCarouselComponent } from './banner/mobile-carousel/mobile-carousel.component';

@Component({
  selector: 'app-root',
  imports: [MobileCarouselComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  banners = signal<Banner[]>([]);
  loading = signal(true);
  isMobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 600px)')
      .pipe(map(result => result.matches)),
    { initialValue: false },
  );

  constructor(private bannerService: BannerService) {
    this.bannerService.getBanners().subscribe(banners => {
      this.banners.set(banners);
      this.loading.set(false);
    });
  }
}
