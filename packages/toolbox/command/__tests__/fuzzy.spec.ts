import {describe, expect, it} from 'vitest';

import {fuzzyFilter, fuzzyScore} from '../fuzzy.js';

describe('fuzzy search', () => {
  it('prefers exact substring matches', () => {
    expect(fuzzyScore('home', 'Go to home page')).toBe(100);
  });

  it('matches ordered subsequences', () => {
    expect(fuzzyScore('gh', 'Go Home')).toBeGreaterThan(0);
    expect(fuzzyScore('hg', 'Go Home')).toBe(0);
  });

  it('filters and sorts matching commands', () => {
    const results = fuzzyFilter('gh', [
      {id: 'a', name: 'Go Home', action: () => {}},
      {id: 'b', name: 'Profile', action: () => {}},
      {id: 'c', name: 'Global Help', action: () => {}},
    ]);

    expect(results.map(item => item.id)).toEqual(['a', 'c']);
  });
});
