# Angular Mobile Banner Carousel

An infinite swipeable banner carousel built with Angular 21, designed exclusively for mobile screens. No third-party libraries — only the standard Angular toolset and pure SCSS.

## Live Demo

Three promotional banners cycle infinitely via touch swipe:

1. **WinzUp Loyalty Program** — Get up to 35% in rewards: daily rakeback, weekly cashback and level-up bonuses
2. **Valentine's Fortune Drops** — Trigger random prizes and win a share of €30,000!
3. **Wheel of Winz** — Spin the wheel to win up to €15,000 weekly

## Features

- **Infinite loop** — swipe past the last slide and seamlessly land on the first (and vice versa)
- **Touch swipe navigation** — native Touch API with direction locking (horizontal vs vertical)
- **Mobile-only** (`<600px`) — no desktop layout, single `100vw` slide
- **Abstracted slide data** — banners defined via a `Banner` interface and served through an injectable `BannerService`
- **Simulated API loading** — 800ms delay with a loading spinner, easily swappable for a real HTTP call
- **Accessibility** — ARIA roles, screen-reader labels, `prefers-reduced-motion` support
- **Performance** — `OnPush` change detection, Angular Signals, GPU-accelerated CSS transforms, `requestAnimationFrame`

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Angular 21 (standalone components, new control flow) |
| State | Angular Signals (`signal`, `computed`, `toSignal`) |
| Styling | SCSS with BEM naming, OKLCH design tokens, CSS custom properties |
| Images | `NgOptimizedImage` for lazy loading and srcset |
| Testing | Karma + Jasmine |
| Build | Angular CLI / esbuild |

No third-party carousel, animation, or gesture libraries are used.

## Architecture Decisions

### Why a custom JS carousel instead of CSS `scroll-snap`?

CSS `scroll-snap` was considered and rejected for several reasons:

| Requirement | `scroll-snap` | Custom JS |
|---|---|---|
| Infinite looping | Not possible — scroll containers have a finite start and end | Achieved via virtual clone slides and instant repositioning on `transitionend` |
| Swipe direction locking | Browser-controlled — cannot reliably prevent vertical scroll during a horizontal swipe | Full control via `touchstart`/`touchmove`/`touchend` with a 5px direction-lock threshold |
| Snap threshold tuning | Fixed browser heuristics | Configurable — currently 20% of viewport width |
| Transition easing | Browser default deceleration curve | Custom cubic-bezier (`0.25, 0.1, 0.25, 1`) |
| ARIA state sync | Difficult — scroll position doesn't map cleanly to "current slide" | `trackIndex` signal drives both transform and ARIA labels in sync |

In short, `scroll-snap` works well for finite, non-looping carousels, but the **infinite-loop requirement** demands programmatic control over positioning and transitions that CSS alone cannot provide.

### How the infinite loop works

The DOM contains `N + 2` slides: a clone of the last slide is prepended and a clone of the first slide is appended.

```
DOM order:   [Clone-Last] [Slide 1] [Slide 2] [Slide 3] [Clone-First]
Track index:      0           1         2         3           4
```

When a CSS transition ends on a clone slide, the component:

1. Disables the CSS transition
2. Instantly jumps `trackIndex` to the real counterpart (e.g., index 4 → 1, or index 0 → 3)
3. Re-enables transitions on the next user interaction

The jump is imperceptible because both the clone and the real slide render identical content.

### Data abstraction

Slide content is defined by the `Banner` interface:

```typescript
interface Banner {
  id: number;
  backgroundImage: string;
  mainImage: string;
  title: string;
  text: string;
  buttonText: string;
}
```

`BannerService` returns an `Observable<Banner[]>`, currently backed by mock data with an 800ms delay to simulate an API call. Swapping to a real endpoint requires changing one line:

```typescript
// Mock
return of(BANNERS).pipe(delay(800));

// Real API
return this.http.get<Banner[]>('/api/banners');
```

### Signals over RxJS for component state

Local carousel state (`trackIndex`, `translateX`, `isTransitioning`) uses Angular Signals rather than RxJS subjects. Signals integrate natively with Angular's change detection and avoid manual subscription management. The `BannerService` still uses `Observable` for the async data fetch, bridged to a signal via `toSignal()`.

### OnPush change detection

Both the root `App` component and `MobileCarouselComponent` use `ChangeDetectionStrategy.OnPush`. Combined with Signals, this ensures the framework only re-renders when state actually changes — no unnecessary checks on every touch event.

## Project Structure

```
src/
├── app/
│   ├── app.ts / .html / .scss           # Root component
│   ├── banner/
│   │   ├── banner.model.ts              # Banner interface
│   │   ├── banner.service.ts            # Data service (mock API with delay)
│   │   └── mobile-carousel/
│   │       ├── mobile-carousel.component.ts    # Carousel logic
│   │       ├── mobile-carousel.component.html  # Template
│   │       ├── mobile-carousel.component.scss  # Styles
│   │       └── carousel.config.ts              # Thresholds & timing constants
│   └── shared/
│       ├── use-breakpoint.ts            # Media query reactive hook
│       ├── pipes/highlight-text.pipe.ts # Markdown **bold** → highlighted span
│       └── button/                      # Reusable button component
├── design-system/
│   ├── _tokens.scss                     # SCSS variables (colors, spacing, fonts)
│   ├── _properties.scss                 # CSS custom properties generated from tokens
│   ├── _reset.scss                      # CSS reset
│   └── _utilities.scss                  # Utility classes (.visually-hidden)
└── styles.scss                          # Global styles & keyframe animations
```

## Getting Started

### Prerequisites

- Node.js 20+
- Angular CLI 21

### Install & Run

```bash
git clone <repo-url>
cd angular-mobile-banner-carousel
npm install
ng serve
```

Open `http://localhost:4200` in a mobile browser or use Chrome DevTools device emulation (any viewport under 600px).

## How to Test

### Manual Testing Checklist

1. **Swipe navigation** — Open in mobile emulation (`<600px`). Swipe left and right. Slides should transition smoothly with no lag.
2. **Infinite loop** — Swipe left past Banner 3. You should seamlessly arrive at Banner 1 with no visible jump or flicker. Swipe right past Banner 1 to verify the reverse direction.
3. **Snap-back** — Start a swipe but move less than ~20% of the screen width, then release. The slide should snap back to its original position.
4. **Direction locking** — Scroll the page vertically. The carousel should not interfere. Start swiping horizontally on the carousel — the page should not scroll vertically.
5. **Loading state** — Hard-refresh the page. A spinner should appear for ~800ms before banners render.
6. **Reduced motion** — Enable "Reduce motion" in your OS accessibility settings. Transitions should be instant (no animation).
7. **Content rendering** — Each slide should display: background image, main image, title, body text (with bold highlights), and a CTA button.

### Automated Tests

```bash
ng test
```

## Configuration

Carousel behavior is tunable via `src/app/banner/mobile-carousel/carousel.config.ts`:

| Constant | Default | Purpose |
|---|---|---|
| `CAROUSEL_SWIPE_THRESHOLD_RATIO` | `0.2` | Fraction of viewport width needed to trigger a slide change |
| `CAROUSEL_DIRECTION_LOCK_THRESHOLD` | `5` | Pixels of movement before locking swipe direction |
| `CAROUSEL_TRANSITION_DURATION` | `400` | Slide transition duration in milliseconds |

## Accessibility

- `role="region"` with `aria-roledescription="carousel"` on the viewport
- Each slide has `role="group"`, `aria-roledescription="slide"`, and `aria-label="Slide X of Y"`
- Clone slides are marked `aria-hidden="true"` so screen readers skip them
- `prefers-reduced-motion: reduce` disables all CSS transitions
- `.visually-hidden` utility provides screen-reader-only text for the loading state

## Performance

The carousel is optimized for smooth 60fps animations on low-end mobile devices:

- **GPU-accelerated transforms** — slide movement uses `translateX()` instead of `left`/`margin`, keeping animations on the compositor thread and off the main thread
- **`will-change: transform`** — hints the browser to promote the carousel track to its own compositing layer, avoiding repaint of surrounding DOM
- **`requestAnimationFrame`** — all transform updates are batched into `rAF` callbacks to stay in sync with the browser's repaint cycle and avoid layout thrashing
- **`OnPush` change detection** — both the root component and the carousel use `OnPush`, so Angular skips change detection on every `touchmove` event unless a signal actually changes
- **Angular Signals** — fine-grained reactivity means only the specific bindings tied to `translateX` or `trackIndex` update during a swipe, not the entire template
- **`NgOptimizedImage`** — banner images use Angular's built-in image directive for automatic lazy loading, `srcset` generation, and priority hints on the first visible slide
- **Minimal DOM** — only `N + 2` slides exist in the DOM (3 banners + 2 clones). No virtualization needed at this scale, but the clone-based approach avoids duplicating the full list
- **CSS containment via scoped styles** — BEM-scoped SCSS and Angular view encapsulation prevent style recalculation from leaking across component boundaries
- **No third-party runtime** — zero external JS dependencies means no extra bundle weight for gesture detection or animation libraries

## What Was Not Implemented (and Why)

| Feature | Status | Reason |
|---|---|---|
| Desktop layout | Skipped | Requirements specify mobile-only (`<600px`) |
| Real API integration | Mock only | Out of scope — service interface is ready for a real endpoint |

## License

MIT
