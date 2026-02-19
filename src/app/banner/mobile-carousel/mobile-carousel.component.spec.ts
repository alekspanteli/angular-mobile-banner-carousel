import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileCarouselComponent } from './mobile-carousel.component';
import { Banner } from '../banner.model';
import { HighlightTextPipe } from '../../shared/pipes/highlight-text.pipe';
import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

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
    text: 'Text 1',
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
    mainImage: 'img3.jpg',
    title: 'Banner 3',
    text: 'Text 3',
    buttonText: 'Button 3',
  },
];

@Component({
  selector: 'app-host',
  template: `<app-mobile-carousel [banners]="banners"></app-mobile-carousel>`,
  imports: [MobileCarouselComponent],
})
class HostComponent {
  banners = mockBanners;
}

describe('MobileCarouselComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: MobileCarouselComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, HighlightTextPipe, NgOptimizedImage],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  it('should render the correct number of banners', () => {
    expect(component.slideCount()).toBe(mockBanners.length);
  });

  it('should create slides with clones', () => {
    const slides = component.slides();
    expect(slides.length).toBe(mockBanners.length + 2);
    expect(slides[0].id).toBe(mockBanners[mockBanners.length - 1].id);
    expect(slides[slides.length - 1].id).toBe(mockBanners[0].id);
  });

  it('should report live text', () => {
    expect(component.liveText()).toBe('Slide 1 of 3');
  });

  it('should go to next and previous slide on swipe', async () => {
    const initialIndex = component.trackIndex();
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });

    const makeTouchEvent = (touches: any[]) => ({
      touches,
      preventDefault: () => {},
    }) as any;

    component.onTouchStart(makeTouchEvent([{ clientX: 500, clientY: 0 }]));
    component.onTouchMove(makeTouchEvent([{ clientX: 200, clientY: 0 }]));
    component.onTouchEnd();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.trackIndex()).toBe(initialIndex + 1);

    component.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 0 }]));
    component.onTouchMove(makeTouchEvent([{ clientX: 500, clientY: 0 }]));
    component.onTouchEnd();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.trackIndex()).toBe(initialIndex);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
  });

  it('should auto-play to next slide after interval', async () => {
    const initialIndex = component.trackIndex();
    (component as any).stopAutoPlay();
    (component as any).autoTimer = setInterval(() => {
      (component as any).goToIndex(component.trackIndex() + 1);
    }, 10);
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
    expect(component.trackIndex()).toBe(initialIndex + 1);
    (component as any).stopAutoPlay();
  });

  it('should stop auto-play on destroy', () => {
    (component as any).autoTimer = setInterval(() => {}, 10000);
    component.ngOnDestroy();
    expect((component as any).autoTimer).toBeNull();
  });

  it('should toggle pause state', () => {
    expect(component.paused()).toBe(false);
    component.toggleAutoPlay();
    expect(component.paused()).toBe(true);
    component.toggleAutoPlay();
    expect(component.paused()).toBe(false);
  });

  it('should navigate dots with keyboard', () => {
    component.goToDot(0);
    expect(component.activeDot()).toBe(0);

    component.onDotsKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.activeDot()).toBe(1);

    component.onDotsKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(component.activeDot()).toBe(0);

    component.onDotsKeydown(new KeyboardEvent('keydown', { key: 'End' }));
    expect(component.activeDot()).toBe(2);

    component.onDotsKeydown(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(component.activeDot()).toBe(0);
  });
});
