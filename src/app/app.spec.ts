import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { BannerService } from './banner/banner.service';
import { of, throwError } from 'rxjs';

describe('App', () => {
  function setup(serviceOverride?: Partial<BannerService>) {
    TestBed.configureTestingModule({
      imports: [App],
      providers: serviceOverride
        ? [{ provide: BannerService, useValue: serviceOverride }]
        : [],
    });
    return TestBed.createComponent(App);
  }

  it('should create the app', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set loading to false and error to false after banners load', () => {
    const fixture = setup({
      getBanners: () => of([{ id: 1, backgroundImage: '', title: '', text: '', buttonText: '' }]),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe(false);
    expect(fixture.componentInstance.banners().length).toBe(1);
  });

  it('should set error to true when service fails', () => {
    const fixture = setup({
      getBanners: () => throwError(() => new Error('Network error')),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe(true);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.banners().length).toBe(0);
  });
});
