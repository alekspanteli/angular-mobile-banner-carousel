import { HighlightTextPipe } from './highlight-text.pipe';

describe('HighlightTextPipe', () => {
  const pipe = new HighlightTextPipe();

  it('should return empty array for null', () => {
    expect(pipe.transform(null)).toEqual([]);
  });

  it('should return empty array for undefined', () => {
    expect(pipe.transform(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(pipe.transform('')).toEqual([]);
  });

  it('should return plain text with no highlights', () => {
    expect(pipe.transform('plain text')).toEqual([
      { text: 'plain text', highlight: false },
    ]);
  });

  it('should highlight text between double asterisks', () => {
    expect(pipe.transform('Get **35%** rewards')).toEqual([
      { text: 'Get ', highlight: false },
      { text: '35%', highlight: true },
      { text: ' rewards', highlight: false },
    ]);
  });

  it('should handle multiple highlighted segments', () => {
    const result = pipe.transform('**A** and **B**');
    expect(result).toEqual([
      { text: 'A', highlight: true },
      { text: ' and ', highlight: false },
      { text: 'B', highlight: true },
    ]);
  });

  it('should handle text that is entirely highlighted', () => {
    expect(pipe.transform('**everything**')).toEqual([
      { text: 'everything', highlight: true },
    ]);
  });
});
