import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileCarouselComponent } from './mobile-carousel.component';
import { Banner } from '../banner.model';
import { HighlightTextPipe } from '../../shared/pipes/highlight-text.pipe';
import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';


// Mock Banner Data
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
  standalone: true,
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

  it('should go to next and previous slide on swipe', async () => {
    const initialIndex = component.trackIndex();
    // Set window.innerWidth to a known value for threshold logic
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    // Helper to mock TouchEvent with preventDefault
    const makeTouchEvent = (touches: any[]) => ({
      touches,
      preventDefault: () => {},
    }) as any;
    // Simulate swipe left (next) with distance > 200
    component.onTouchStart(makeTouchEvent([{ clientX: 500, clientY: 0 }]));
    component.onTouchMove(makeTouchEvent([{ clientX: 200, clientY: 0 }]));
    component.onTouchEnd();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.trackIndex()).toBe(initialIndex + 1);
    // Simulate swipe right (previous) with distance > 200
    component.onTouchStart(makeTouchEvent([{ clientX: 200, clientY: 0 }]));
    component.onTouchMove(makeTouchEvent([{ clientX: 500, clientY: 0 }]));
    component.onTouchEnd();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.trackIndex()).toBe(initialIndex);
    // Restore window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
  });

  it('should auto-play to next slide after interval', async () => {
    const initialIndex = component.trackIndex();
    // Patch startAutoPlay to use a short interval for testing
    (component as any).stopAutoPlay();
    (component as any).autoTimer = setInterval(() => {
      (component as any).goToIndex(component.trackIndex() + 1);
    }, 10);
    // Wait for the interval to trigger
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
});
