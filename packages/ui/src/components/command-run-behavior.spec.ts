import {describe, expect, it} from 'vitest';

import {shouldClosePaletteAfterRun} from './command-run-behavior.js';

describe('command-run-behavior', () => {
  it('closes palette by default', () => {
    expect(shouldClosePaletteAfterRun({})).toBe(true);
  });

  it('keeps palette open when command opts out', () => {
    expect(shouldClosePaletteAfterRun({closeOnRun: false})).toBe(false);
  });
});
