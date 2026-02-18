import { Component, signal } from '@angular/core';
import { Banner } from './banner.model';
import { BannerService } from './banner.service';
import { MobileCarouselComponent } from './mobile-carousel.component';

@Component({
  selector: 'app-root',
  imports: [MobileCarouselComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  banners = signal<Banner[]>([]);
  loading = signal(true);

  constructor(private bannerService: BannerService) {
    this.bannerService.getBanners().subscribe(banners => {
      this.banners.set(banners);
      this.loading.set(false);
    });
  }
}
