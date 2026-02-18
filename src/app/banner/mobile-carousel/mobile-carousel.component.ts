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
} from '@angular/core';
import { Banner } from '../banner.model';
import { HighlightTextPipe } from '../highlight-text.pipe';

@Component({
  selector: 'app-mobile-carousel',
  imports: [HighlightTextPipe],
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
  banners = input.required<Banner[]>();

  /** Index into the extended track: 0 = last clone, 1..N = real slides, N+1 = first clone */
  trackIndex = signal(1);
  translateX = signal(0);
  isTransitioning = signal(true);

  readonly slideCount = computed(() => this.banners().length);

  /** Real slide index (0-based) for dot indicators */
  readonly activeDot = computed(() => {
    const idx = this.trackIndex();
    const count = this.slideCount();
    if (idx <= 0) return count - 1;
    if (idx > count) return 0;
    return idx - 1;
  });

  private touchStartX = 0;
  private touchStartY = 0;
  private touchDeltaX = 0;
  private isSwiping = false;
  private directionLocked = false;
  private autoTimer: ReturnType<typeof setInterval> | null = null;
  private destroyRef = inject(DestroyRef);
  private resizeHandler = () => {
    this.isTransitioning.set(false);
    this.updateTranslate();
  };

  ngOnInit(): void {
    this.trackIndex.set(1);
    this.updateTranslate();
    this.startAutoPlay();

    window.addEventListener('resize', this.resizeHandler);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', this.resizeHandler));
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
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
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.directionLocked = true;
        this.isSwiping = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (this.isSwiping) {
      event.preventDefault();
      this.touchDeltaX = dx;
      const base = -this.trackIndex() * window.innerWidth;
      this.translateX.set(base + dx);
    }
  }

  onTouchEnd(): void {
    if (this.isSwiping) {
      const threshold = window.innerWidth * 0.2;
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

  goToDot(realIndex: number): void {
    this.goToIndex(realIndex + 1);
    this.restartAutoPlay();
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

  private updateTranslate(): void {
    this.translateX.set(-this.trackIndex() * window.innerWidth);
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoTimer = setInterval(() => {
      this.goToIndex(this.trackIndex() + 1);
    }, 10_000);
  }

  private stopAutoPlay(): void {
    if (this.autoTimer !== null) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  private restartAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
