import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileCarouselComponent } from './mobile-carousel.component';
import { Banner } from '../banner.model';
import { HighlightTextPipe } from '../../shared/pipes/highlight-text.pipe';
import { NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { CAROUSEL_AUTO_PLAY_INTERVAL } from './carousel.config';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

const mockBanners: Banner[] = [
  {
    id: 1,
    backgroundImage: 'bg1.jpg',
    mainImage: 'img1.jpg',
    title: 'Banner 1',
    text: 'Text with **bold** content',
    buttonText: 'Button 1',
  },
  {
    id: 2,
    backgroundImage: 'bg2.jpg',
    mainImage: 'img2.jpg',
    title: 'Banner 2',
    text: 'Text 2',
    buttonText: 'Button 2',
  },
  {
    id: 3,
    backgroundImage: 'bg3.jpg',
    title: 'Banner 3',
    text: 'Text 3',
    buttonText: 'Button 3',
  },
];

function makeTouchEvent(clientX: number, clientY = 0, touchCount = 1): TouchEvent {
  const touches = Array.from({ length: touchCount }, () => ({ clientX, clientY }));
  return { touches, preventDefault: () => {} } as unknown as TouchEvent;
}

@Component({
  selector: 'app-host',
  template: `<app-mobile-carousel [banners]="banners()" />`,
  imports: [MobileCarouselComponent],
})
class HostComponent {
  banners = signal<Banner[]>(mockBanners);
}

describe('MobileCarouselComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: MobileCarouselComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, HighlightTextPipe, NgOptimizedImage],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('initialization', () => {
    it('should render the correct number of banners', () => {
      expect(component.slideCount()).toBe(mockBanners.length);
    });

    it('should create slides with clones for infinite loop', () => {
      const slides = component.slides();
      expect(slides.length).toBe(mockBanners.length + 2);
      expect(slides[0].id).toBe(mockBanners[mockBanners.length - 1].id);
      expect(slides[slides.length - 1].id).toBe(mockBanners[0].id);
    });

    it('should start at track index 1 (first real slide)', () => {
      expect(component.trackIndex()).toBe(1);
    });

    it('should report activeSlideIndex as 1 initially', () => {
      expect(component.activeSlideIndex()).toBe(1);
    });
  });

  describe('single banner edge case', () => {
    it('should not create clones for a single banner', () => {
      host.banners.set([mockBanners[0]]);
      fixture.detectChanges();
      const singleComponent: MobileCarouselComponent =
        fixture.debugElement.children[0].componentInstance;
      expect(singleComponent.slides().length).toBe(1);
      expect(singleComponent.isInfinite()).toBe(false);
    });
  });

  describe('empty banners edge case', () => {
    it('should produce empty slides array', () => {
      host.banners.set([]);
      fixture.detectChanges();
      const emptyComponent: MobileCarouselComponent =
        fixture.debugElement.children[0].componentInstance;
      expect(emptyComponent.slides().length).toBe(0);
      expect(emptyComponent.slideCount()).toBe(0);
    });
  });

  describe('banner without mainImage', () => {
    it('should handle banners with optional mainImage', () => {
      const slides = component.slides();
      const banner3Slide = slides.find(s => s.id === 3);
      expect(banner3Slide).toBeDefined();
      expect(banner3Slide!.mainImage).toBeUndefined();
    });
  });

  describe('input reactivity', () => {
    it('should reset to slide 1 when banners input changes', () => {
      // Advance to slide 2
      component.onTouchStart(makeTouchEvent(300, 0));
      component.onTouchMove(makeTouchEvent(50, 0));
      component.onTouchEnd();

      // Change banners — effect should reset trackIndex
      host.banners.set([
        { id: 10, backgroundImage: 'new1.jpg', title: 'New 1', text: 'T', buttonText: 'B' },
        { id: 11, backgroundImage: 'new2.jpg', title: 'New 2', text: 'T', buttonText: 'B' },
      ]);
      fixture.detectChanges();

      expect(component.trackIndex()).toBe(1);
      expect(component.slideCount()).toBe(2);
    });

    it('should stop autoplay when switching to single banner', () => {
      host.banners.set([mockBanners[0]]);
      fixture.detectChanges();
      expect((component as any).autoTimer).toBeNull();
    });
  });

  describe('swipe gestures', () => {
    beforeEach(() => {
      Object.defineProperty(component['el'].nativeElement, 'offsetWidth', {
        configurable: true,
        value: 400,
      });
    });

    it('should advance to next slide on left swipe', () => {
      const initial = component.trackIndex();
      component.onTouchStart(makeTouchEvent(300, 0));
      component.onTouchMove(makeTouchEvent(50, 0));
      component.onTouchEnd();
      expect(component.trackIndex()).toBe(initial + 1);
    });

    it('should go to previous slide on right swipe', () => {
      component.onTouchStart(makeTouchEvent(300, 0));
      component.onTouchMove(makeTouchEvent(50, 0));
      component.onTouchEnd();
      const afterAdvance = component.trackIndex();

      component.onTouchStart(makeTouchEvent(50, 0));
      component.onTouchMove(makeTouchEvent(300, 0));
      component.onTouchEnd();
      expect(component.trackIndex()).toBe(afterAdvance - 1);
    });

    it('should snap back if swipe does not exceed threshold', () => {
      const initial = component.trackIndex();
      component.onTouchStart(makeTouchEvent(200, 0));
      component.onTouchMove(makeTouchEvent(170, 0));
      component.onTouchEnd();
      expect(component.trackIndex()).toBe(initial);
    });

    it('should ignore multi-touch events', () => {
      const initial = component.trackIndex();
      component.onTouchStart(makeTouchEvent(300, 0, 2));
      component.onTouchMove(makeTouchEvent(50, 0, 2));
      component.onTouchEnd();
      expect(component.trackIndex()).toBe(initial);
    });

    it('should not swipe on vertical gesture (scroll)', () => {
      const initial = component.trackIndex();
      component.onTouchStart(makeTouchEvent(200, 0));
      const verticalEvent = {
        touches: [{ clientX: 202, clientY: 100 }],
        preventDefault: () => {},
      } as unknown as TouchEvent;
      component.onTouchMove(verticalEvent);
      component.onTouchEnd();
      expect(component.trackIndex()).toBe(initial);
    });
  });

  describe('keyboard navigation', () => {
    it('should advance on ArrowRight', () => {
      const initial = component.trackIndex();
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(component.trackIndex()).toBe(initial + 1);
    });

    it('should go back on ArrowLeft', () => {
      // First advance
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      const after = component.trackIndex();
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(component.trackIndex()).toBe(after - 1);
    });

    it('should ignore non-arrow keys', () => {
      const initial = component.trackIndex();
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.trackIndex()).toBe(initial);
    });
  });

  describe('dot indicator navigation', () => {
    it('should navigate to a specific slide via goToSlide', () => {
      component.goToSlide(3);
      expect(component.trackIndex()).toBe(3);
    });

    it('should ignore out-of-range indices', () => {
      const initial = component.trackIndex();
      component.goToSlide(0);
      expect(component.trackIndex()).toBe(initial);
      component.goToSlide(99);
      expect(component.trackIndex()).toBe(initial);
    });
  });

  describe('infinite loop transition', () => {
    it('should jump to last real slide when transitioning past the leading clone', () => {
      component['goToIndex'](0);
      component.onTransitionEnd();
      expect(component.trackIndex()).toBe(mockBanners.length);
    });

    it('should jump to first real slide when transitioning past the trailing clone', () => {
      component['goToIndex'](mockBanners.length + 1);
      component.onTransitionEnd();
      expect(component.trackIndex()).toBe(1);
    });
  });

  describe('autoplay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should advance slide after autoplay interval', () => {
      (component as any).stopAutoPlay();
      (component as any).startAutoPlay();
      const initial = component.trackIndex();
      vi.advanceTimersByTime(CAROUSEL_AUTO_PLAY_INTERVAL + 100);
      expect(component.trackIndex()).toBeGreaterThan(initial);
    });

    it('should stop autoplay on destroy', () => {
      component.ngOnDestroy();
      expect((component as any).autoTimer).toBeNull();
    });

    it('should stop autoplay during touch and resume after', () => {
      component.onTouchStart(makeTouchEvent(200, 0));
      expect((component as any).autoTimer).toBeNull();
      component.onTouchEnd();
      expect((component as any).autoTimer).not.toBeNull();
    });
  });

  describe('lifecycle safety', () => {
    it('should set destroyed flag on destroy', () => {
      component.ngOnDestroy();
      expect((component as any).destroyed).toBe(true);
    });

    it('should cancel pending rAF on destroy', () => {
      (component as any).updateTranslateSync();
      expect((component as any).rafId).not.toBeNull();
      component.ngOnDestroy();
      expect((component as any).rafId).toBeNull();
    });
  });
});
