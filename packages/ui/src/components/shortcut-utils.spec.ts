import {describe, expect, it} from 'vitest';

import {normalizeShortcutKey, renderShortcut} from './shortcut-utils.js';

describe('shortcut-utils', () => {
  it('normalizes modifier and character keys', () => {
    expect(normalizeShortcutKey('ctrl')).toBe('Ctrl');
    expect(normalizeShortcutKey('meta')).toBe('⌘');
    expect(normalizeShortcutKey('a')).toBe('A');
  });

  it('renders shortcuts and sequences', () => {
    expect(renderShortcut('ctrl+k')).toBe('Ctrl+K');
    expect(renderShortcut('meta+shift+p g')).toBe('⌘+Shift+P then G');
  });
});
