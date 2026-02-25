import { isBanner, parseBanners } from './banner.model';

describe('isBanner', () => {
  it('should return true for a valid banner', () => {
    expect(
      isBanner({
        id: 1,
        backgroundImage: 'bg.jpg',
        title: 'Title',
        text: 'Text',
        buttonText: 'Click',
      }),
    ).toBe(true);
  });

  it('should return true when mainImage is present', () => {
    expect(
      isBanner({
        id: 1,
        backgroundImage: 'bg.jpg',
        mainImage: 'img.jpg',
        title: 'Title',
        text: 'Text',
        buttonText: 'Click',
      }),
    ).toBe(true);
  });

  it('should return false for null', () => {
    expect(isBanner(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isBanner(undefined)).toBe(false);
  });

  it('should return false when id is missing', () => {
    expect(
      isBanner({ backgroundImage: 'bg.jpg', title: 'T', text: 'T', buttonText: 'B' }),
    ).toBe(false);
  });

  it('should return false when id is a string', () => {
    expect(
      isBanner({ id: '1', backgroundImage: 'bg.jpg', title: 'T', text: 'T', buttonText: 'B' }),
    ).toBe(false);
  });

  it('should return false when mainImage is a number', () => {
    expect(
      isBanner({ id: 1, backgroundImage: 'bg.jpg', mainImage: 123, title: 'T', text: 'T', buttonText: 'B' }),
    ).toBe(false);
  });
});

describe('parseBanners', () => {
  it('should return empty array for non-array input', () => {
    expect(parseBanners('not an array')).toEqual([]);
    expect(parseBanners(null)).toEqual([]);
    expect(parseBanners(42)).toEqual([]);
  });

  it('should filter out invalid entries', () => {
    const result = parseBanners([
      { id: 1, backgroundImage: 'bg.jpg', title: 'T', text: 'T', buttonText: 'B' },
      { broken: true },
      null,
    ]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('should return all valid entries', () => {
    const input = [
      { id: 1, backgroundImage: 'a', title: 'A', text: 'A', buttonText: 'A' },
      { id: 2, backgroundImage: 'b', title: 'B', text: 'B', buttonText: 'B' },
    ];
    expect(parseBanners(input).length).toBe(2);
  });

  it('should return empty array for empty array input', () => {
    expect(parseBanners([])).toEqual([]);
  });
});
