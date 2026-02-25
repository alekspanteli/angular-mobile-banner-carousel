import {
  Component,
  input,
  signal,
  computed,
  effect,
  OnDestroy,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
    '(keydown)': 'onKeyDown($event)',
  },
})
export class MobileCarouselComponent implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly banners = input.required<Banner[]>();

  readonly trackIndex = signal(1);
  readonly translateX = signal(0);
  readonly isTransitioning = signal(true);

  readonly slideCount = computed(() => this.banners().length);
  readonly isInfinite = computed(() => this.banners().length > 1);

  /** Logical 1-based index into real banners (not clones). */
  readonly activeSlideIndex = computed(() => {
    const count = this.slideCount();
    if (count === 0) return 0;
    const idx = this.trackIndex();
    if (idx <= 0) return count;
    if (idx > count) return 1;
    return idx;
  });

  /** Slides array with leading/trailing clones for infinite loop. */
  readonly slides = computed(() => {
    const b = this.banners();
    if (b.length === 0) return [];
    if (b.length === 1) return b;
    return [b[b.length - 1], ...b, b[0]];
  });

  // --- Touch state (mutable, not reactive — intentional for perf) ---
  private touchStartX = 0;
  private touchStartY = 0;
  private touchDeltaX = 0;
  private isSwiping = false;
  private directionLocked = false;

  // --- Timers & animation ---
  private rafId: number | null = null;
  private autoTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  // --- Accessibility: reduced motion ---
  private prefersReducedMotion = false;
  private motionMediaQuery: MediaQueryList | null = null;
  private motionHandler = (e: MediaQueryListEvent) => {
    this.prefersReducedMotion = e.matches;
    if (e.matches) {
      this.stopAutoPlay();
    } else if (!this.destroyed) {
      this.startAutoPlay();
    }
  };

  private resizeHandler = () => {
    this.isTransitioning.set(false);
    this.updateTranslateSync();
  };

  private visibilityHandler = () => {
    if (document.hidden) {
      this.stopAutoPlay();
    } else if (!this.prefersReducedMotion) {
      this.startAutoPlay();
    }
  };

  constructor() {
    // React to banner input changes — resets carousel position when data changes.
    // This is critical: Angular MCP guarantees signal inputs are reactive,
    // so we must handle re-initialization, not just ngOnInit.
    effect(() => {
      const banners = this.banners();
      if (banners.length <= 1) {
        this.trackIndex.set(banners.length > 0 ? 0 : 0);
        this.stopAutoPlay();
      } else {
        this.trackIndex.set(1);
        if (!this.prefersReducedMotion) {
          this.startAutoPlay();
        }
      }
      this.isTransitioning.set(false);
      this.updateTranslateSync();
    });

    if (this.isBrowser) {
      this.motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = this.motionMediaQuery.matches;
      this.motionMediaQuery.addEventListener('change', this.motionHandler);

      window.addEventListener('resize', this.resizeHandler);
      document.addEventListener('visibilitychange', this.visibilityHandler);

      this.destroyRef.onDestroy(() => {
        this.motionMediaQuery?.removeEventListener('change', this.motionHandler);
        window.removeEventListener('resize', this.resizeHandler);
        document.removeEventListener('visibilitychange', this.visibilityHandler);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopAutoPlay();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // --- Keyboard navigation (WCAG 2.1 §4.1.2) ---
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isInfinite()) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.stopAutoPlay();
        this.goToIndex(this.trackIndex() - 1);
        this.scheduleAutoPlayRestart();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.stopAutoPlay();
        this.goToIndex(this.trackIndex() + 1);
        this.scheduleAutoPlayRestart();
        break;
    }
  }

  // --- Touch gesture handlers ---
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1 || !this.isInfinite()) return;
    this.stopAutoPlay();
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchDeltaX = 0;
    this.isSwiping = false;
    this.directionLocked = false;
    this.isTransitioning.set(false);
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length !== 1 || !this.isInfinite()) return;

    const dx = event.touches[0].clientX - this.touchStartX;
    const dy = event.touches[0].clientY - this.touchStartY;

    if (!this.directionLocked) {
      if (
        Math.abs(dx) > CAROUSEL_DIRECTION_LOCK_THRESHOLD ||
        Math.abs(dy) > CAROUSEL_DIRECTION_LOCK_THRESHOLD
      ) {
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
    this.scheduleAutoPlayRestart();
  }

  onTransitionEnd(): void {
    const count = this.slideCount();
    const idx = this.trackIndex();

    if (idx <= 0) {
      this.isTransitioning.set(false);
      this.trackIndex.set(count);
      this.updateTranslateSync();
    } else if (idx > count) {
      this.isTransitioning.set(false);
      this.trackIndex.set(1);
      this.updateTranslateSync();
    }
  }

  /** Navigate to a specific real banner index (1-based). Used by dot indicators. */
  goToSlide(realIndex: number): void {
    if (realIndex < 1 || realIndex > this.slideCount()) return;
    this.stopAutoPlay();
    this.goToIndex(realIndex);
    this.scheduleAutoPlayRestart();
  }

  // --- Private helpers ---

  private goToIndex(index: number): void {
    this.isTransitioning.set(true);
    this.trackIndex.set(index);
    this.updateTranslateSync();
  }

  private getViewportWidth(): number {
    return (
      this.el.nativeElement.offsetWidth ||
      (this.isBrowser ? window.innerWidth : 0)
    );
  }

  /**
   * Synchronous translate update wrapped in rAF for paint batching.
   * Cancels any pending rAF to prevent stale frames.
   */
  private updateTranslateSync(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      if (this.destroyed) return;
      const viewportWidth = this.getViewportWidth();
      this.translateX.set(-this.trackIndex() * viewportWidth);
      this.rafId = null;
    });
  }

  /**
   * Autoplay uses chained setTimeout instead of setInterval.
   * This prevents the next tick from firing if the previous transition hasn't completed,
   * eliminating a class of race conditions where setInterval stacks callbacks.
   */
  private startAutoPlay(): void {
    if (this.prefersReducedMotion || !this.isInfinite() || this.destroyed) return;
    this.stopAutoPlay();
    this.autoTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.goToIndex(this.trackIndex() + 1);
      // Chain: schedule next tick only after this one fires
      this.startAutoPlay();
    }, CAROUSEL_AUTO_PLAY_INTERVAL);
  }

  private stopAutoPlay(): void {
    if (this.autoTimer !== null) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }

  /**
   * Restarts autoplay after user interaction (touch/keyboard),
   * but only if conditions allow.
   */
  private scheduleAutoPlayRestart(): void {
    if (this.isInfinite() && !this.prefersReducedMotion) {
      this.startAutoPlay();
    }
  }
}
