/**
 * Interval (ms) between automatic slide transitions.
 * MCP: Should be long enough for accessibility, short enough for engagement.
 */
export const CAROUSEL_AUTO_PLAY_INTERVAL = 10_000;

/**
 * Ratio of viewport width required to trigger a swipe.
 * MCP: Prevents accidental slide changes on minor gestures.
 */
export const CAROUSEL_SWIPE_THRESHOLD_RATIO = 0.2;

/**
 * Pixel threshold to lock swipe direction.
 * MCP: Ensures vertical scrolls are not misinterpreted as horizontal swipes.
 */
export const CAROUSEL_DIRECTION_LOCK_THRESHOLD = 5;
