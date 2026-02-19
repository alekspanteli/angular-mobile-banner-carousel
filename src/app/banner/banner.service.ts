import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Banner } from './banner.model';

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

@Injectable({ providedIn: 'root' })
export class BannerService {
  getBanners(): Observable<Banner[]> {
    // Simulates an API call with network latency
    return of(BANNERS as Banner[]).pipe(delay(800));
  }
}
