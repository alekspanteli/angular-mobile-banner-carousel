
import { Component, input, signal, effect, ChangeDetectionStrategy, computed } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

import { Banner } from './banner.model';

@Component({
  selector: 'app-mobile-carousel',
  standalone: true,
  imports: [NgOptimizedImage, CommonModule],
  templateUrl: './mobile-carousel.component.html',
  styleUrl: './mobile-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('350ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(.4,0,.2,1)', style({ opacity: 0, transform: 'translateX(-30px)' }))
      ])
    ])
  ],
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd()'
  }
})
export class MobileCarouselComponent {

  banners = input<Banner[]>([]);
  currentIndex = signal(0);
  private touchStartX = 0;
  private touchDeltaX = 0;

  readonly slideCount = computed(() => this.banners()?.length ?? 0);

  getBackgroundImage(url: string | undefined): string {
    return url ? `url(${url})` : '';
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchDeltaX = 0;
  }

  onTouchMove(event: TouchEvent) {
    this.touchDeltaX = event.touches[0].clientX - this.touchStartX;
  }

  onTouchEnd() {
    if (this.touchDeltaX > 50) {
      this.prevSlide();
    } else if (this.touchDeltaX < -50) {
      this.nextSlide();
    }
    this.touchDeltaX = 0;
  }

  prevSlide() {
    const count = this.slideCount();
    if (count > 0) {
      this.currentIndex.update(i => (i - 1 + count) % count);
    }
  }

  nextSlide() {
    const count = this.slideCount();
    if (count > 0) {
      this.currentIndex.update(i => (i + 1) % count);
    }
  }
}
