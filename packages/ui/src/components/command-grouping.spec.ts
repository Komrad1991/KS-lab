import {describe, expect, it} from 'vitest';

import {groupCommandsByCategory} from './command-grouping.js';

describe('command-grouping', () => {
  it('groups commands by category while preserving order', () => {
    const sections = groupCommandsByCategory([
      {id: 'a', name: 'A', action: () => {}, category: 'Demo'},
      {id: 'b', name: 'B', action: () => {}, category: 'Navigation'},
      {id: 'c', name: 'C', action: () => {}, category: 'Demo'},
    ]);

    expect(sections.map(section => section.category)).toEqual([
      'Demo',
      'Navigation',
    ]);
    expect(sections[0].entries.map(entry => entry.command.id)).toEqual([
      'a',
      'c',
    ]);
    expect(sections[1].entries[0].index).toBe(1);
  });

  it('uses fallback category for uncategorized commands', () => {
    const sections = groupCommandsByCategory([
      {id: 'a', name: 'A', action: () => {}},
    ]);

    expect(sections[0].category).toBe('Commands');
  });
});
