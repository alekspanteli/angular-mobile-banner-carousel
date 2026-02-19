import {
  Component,
  input,
  signal,
  computed,
  OnInit,
  OnDestroy,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
} from '@angular/core';

import {
  CAROUSEL_AUTO_PLAY_INTERVAL,
  CAROUSEL_SWIPE_THRESHOLD_RATIO,
  CAROUSEL_DIRECTION_LOCK_THRESHOLD,
} from './carousel.config';

import { Banner } from '../banner.model';
import { HighlightTextPipe } from '../../shared/pipes/highlight-text.pipe';
import { NgOptimizedImage } from '@angular/common';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-mobile-carousel',
  imports: [HighlightTextPipe, NgOptimizedImage, ButtonComponent],
  templateUrl: './mobile-carousel.component.html',
  styleUrl: './mobile-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd()',
  },
})
export class MobileCarouselComponent implements OnInit, OnDestroy {
  private rafId: number | null = null;
  private el = inject(ElementRef);

  banners = input.required<Banner[]>();

  trackIndex = signal(1);
  translateX = signal(0);
  isTransitioning = signal(true);
  readonly slideCount = computed(() => this.banners().length);

  readonly slides = computed(() => {
    const b = this.banners();
    return b.length ? [b[b.length - 1], ...b, b[0]] : [];
  });

  private touchStartX = 0;
  private touchStartY = 0;
  private touchDeltaX = 0;
  private isSwiping = false;
  private directionLocked = false;
  private autoTimer: ReturnType<typeof setInterval> | null = null;
  private prefersReducedMotion = false;
  private destroyRef = inject(DestroyRef);

  private resizeHandler = () => {
    this.isTransitioning.set(false);
    this.updateTranslate();
  };

  ngOnInit(): void {
    this.trackIndex.set(1);
    this.updateTranslate();

    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.addEventListener('resize', this.resizeHandler);
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', this.resizeHandler));
    }

    if (!this.prefersReducedMotion) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.stopAutoPlay();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchDeltaX = 0;
    this.isSwiping = false;
    this.directionLocked = false;
    this.isTransitioning.set(false);
  }

  onTouchMove(event: TouchEvent): void {
    const dx = event.touches[0].clientX - this.touchStartX;
    const dy = event.touches[0].clientY - this.touchStartY;

    if (!this.directionLocked) {
      if (Math.abs(dx) > CAROUSEL_DIRECTION_LOCK_THRESHOLD || Math.abs(dy) > CAROUSEL_DIRECTION_LOCK_THRESHOLD) {
        this.directionLocked = true;
        this.isSwiping = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (this.isSwiping) {
      event.preventDefault();
      this.touchDeltaX = dx;
      const viewportWidth = this.getViewportWidth();
      const base = -this.trackIndex() * viewportWidth;
      this.translateX.set(base + dx);
    }
  }

  onTouchEnd(): void {
    if (this.isSwiping) {
      const viewportWidth = this.getViewportWidth();
      const threshold = viewportWidth * CAROUSEL_SWIPE_THRESHOLD_RATIO;
      if (this.touchDeltaX < -threshold) {
        this.goToIndex(this.trackIndex() + 1);
      } else if (this.touchDeltaX > threshold) {
        this.goToIndex(this.trackIndex() - 1);
      } else {
        this.goToIndex(this.trackIndex());
      }
    }
    this.touchDeltaX = 0;
    this.isSwiping = false;
    this.directionLocked = false;
    this.startAutoPlay();
  }

  onTransitionEnd(): void {
    const count = this.slideCount();
    const idx = this.trackIndex();

    if (idx <= 0) {
      this.isTransitioning.set(false);
      this.trackIndex.set(count);
      this.updateTranslate();
    } else if (idx > count) {
      this.isTransitioning.set(false);
      this.trackIndex.set(1);
      this.updateTranslate();
    }
  }

  private goToIndex(index: number): void {
    this.isTransitioning.set(true);
    this.trackIndex.set(index);
    this.updateTranslate();
  }

  private getViewportWidth(): number {
    return this.el.nativeElement.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 0);
  }

  private updateTranslate(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      const viewportWidth = this.getViewportWidth();
      this.translateX.set(-this.trackIndex() * viewportWidth);
      this.rafId = null;
    });
  }

  private startAutoPlay(): void {
    if (this.prefersReducedMotion) return;
    this.stopAutoPlay();
    this.autoTimer = setInterval(() => {
      this.goToIndex(this.trackIndex() + 1);
    }, CAROUSEL_AUTO_PLAY_INTERVAL);
  }

  private stopAutoPlay(): void {
    if (this.autoTimer !== null) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

}
