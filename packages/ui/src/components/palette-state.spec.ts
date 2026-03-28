import {describe, expect, it} from 'vitest';

import {
  coerceArgumentValue,
  createInitialArgumentValues,
  getArgumentCommand,
  moveSelectionIndex,
} from './palette-state.js';

describe('palette-state', () => {
  it('wraps selection forward and backward', () => {
    expect(moveSelectionIndex(0, 3, -1)).toBe(2);
    expect(moveSelectionIndex(2, 3, 1)).toBe(0);
    expect(moveSelectionIndex(1, 3, 1)).toBe(2);
  });

  it('creates initial values for string and select arguments', () => {
    expect(
      createInitialArgumentValues([
        {name: 'query', type: 'string'},
        {name: 'theme', type: 'select', options: ['light', 'dark']},
      ])
    ).toEqual({
      query: '',
      theme: 'light',
    });
  });

  it('coerces numeric input while preserving empty string', () => {
    expect(coerceArgumentValue({name: 'limit', type: 'number'}, '42')).toBe(42);
    expect(coerceArgumentValue({name: 'limit', type: 'number'}, '')).toBe('');
    expect(coerceArgumentValue({name: 'query', type: 'string'}, 'abc')).toBe(
      'abc'
    );
  });

  it('finds command by argsCommandId', () => {
    const items = [
      {id: 'a', name: 'A', action: () => {}},
      {id: 'b', name: 'B', action: () => {}},
    ];
    expect(getArgumentCommand(items, 'b')?.name).toBe('B');
  });
});
