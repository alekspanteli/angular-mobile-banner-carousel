import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, retry, timer, map } from 'rxjs';
import { Banner, parseBanners } from './banner.model';

const BANNERS: readonly Banner[] = [
  {
    id: 1,
    backgroundImage: 'images/winzup-bg-mob.webp',
    mainImage: 'images/winzup_mob.png',
    title: 'WinzUp Loyalty Program',
    text: 'Get up to **35% in rewards:** daily rakeback, weekly cashback and level-up bonuses',
    buttonText: 'Join now',
  },
  {
    id: 2,
    backgroundImage: 'images/ValentinesFortuneDrops_mob-bg.png',
    mainImage: 'images/ValentinesFortuneDrops_mob-pic.png',
    title: `Valentine's Fortune Drops`,
    text: 'Trigger random prizes and win a share of **€30,000!**',
    buttonText: 'Learn more',
  },
  {
    id: 3,
    backgroundImage: 'images/wheel-mob-bg.webp',
    mainImage: 'images/wheel-mob.png',
    title: 'Wheel of Winz',
    text: 'Spin the wheel to win up to **€15,000** weekly',
    buttonText: 'Spin now',
  },
] as const;

/** Whether to use mock data instead of HTTP. Flip to false when a real API exists. */
const USE_MOCK = true;

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly http = inject(HttpClient, { optional: true });

  getBanners(): Observable<Banner[]> {
    if (USE_MOCK) {
      // Simulates network latency for development.
      return of([...BANNERS]).pipe(delay(800));
    }

    if (!this.http) {
      throw new Error(
        'BannerService requires HttpClient. Provide provideHttpClient() in your app config.',
      );
    }

    return this.http.get<unknown>('/api/banners').pipe(
      // Validate at the system boundary — API response is unknown until proven safe.
      map((data) => {
        const banners = parseBanners(data);
        if (banners.length === 0) {
          throw new Error('API returned no valid banners');
        }
        return banners;
      }),
      // Exponential backoff: 1s, 2s, 4s — prevents thundering herd on transient failures.
      retry({ count: 2, delay: (_, retryIndex) => timer(1000 * Math.pow(2, retryIndex - 1)) }),
    );
  }
}
