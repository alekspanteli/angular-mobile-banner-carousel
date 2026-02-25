export interface Banner {
  readonly id: number;
  readonly backgroundImage: string;
  readonly mainImage?: string;
  readonly title: string;
  readonly text: string;
  readonly buttonText: string;
}

/**
 * Runtime type guard for API boundary validation.
 * Ensures each banner has the required shape before the app trusts it.
 */
export function isBanner(value: unknown): value is Banner {
  if (value == null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['id'] === 'number' &&
    typeof obj['backgroundImage'] === 'string' &&
    typeof obj['title'] === 'string' &&
    typeof obj['text'] === 'string' &&
    typeof obj['buttonText'] === 'string' &&
    (obj['mainImage'] === undefined || typeof obj['mainImage'] === 'string')
  );
}

/**
 * Validates and filters an array of unknown values, returning only valid Banners.
 * Logs warnings for malformed entries in dev mode so data issues surface early.
 */
export function parseBanners(data: unknown): Banner[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item, index) => {
    const valid = isBanner(item);
    if (!valid && typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn(`Banner at index ${index} failed validation:`, item);
    }
    return valid;
  });
}
