import {beforeEach, describe, expect, it, vi} from 'vitest';

import CommandHistoryStore from '../history.js';

describe('CommandHistoryStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps history unique, ordered by recency and capped at 50 items', () => {
    const store = new CommandHistoryStore();

    for (let index = 0; index < 55; index++) {
      store.add(`cmd-${index}`);
    }
    store.add('cmd-10');

    expect(store.getAll()).toHaveLength(50);
    expect(store.getAll()[0]).toBe('cmd-10');
    expect(store.getAll().filter(id => id === 'cmd-10')).toHaveLength(1);
  });

  it('tracks usage counts separately from recency', () => {
    const store = new CommandHistoryStore();

    store.add('alpha');
    store.add('beta');
    store.add('alpha');

    expect(store.getAll()).toEqual(['alpha', 'beta']);
    expect(store.getUsageCount('alpha')).toBe(2);
    expect(store.getUsageCount('beta')).toBe(1);
  });

  it('falls back to empty state when persisted data is invalid', () => {
    localStorage.setItem('tinijs.history.commands', '{"oops":true}');
    localStorage.setItem('tinijs.history.command-counts', '["bad"]');

    const store = new CommandHistoryStore();

    expect(store.getAll()).toEqual([]);
    expect(store.getUsageCount('missing')).toBe(0);
  });

  it('ignores storage write errors', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded');
      });
    const store = new CommandHistoryStore();

    expect(() => store.add('safe')).not.toThrow();
    expect(() => store.clear()).not.toThrow();

    setItem.mockRestore();
  });
});
