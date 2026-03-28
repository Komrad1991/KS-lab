import {describe, expect, it, vi} from 'vitest';

describe('palette-primitives', () => {
  it('registers palette primitives safely and idempotently', async () => {
    vi.resetModules();
    const module = await import('./palette-primitives.js');

    expect(() => module.ensurePalettePrimitivesRegistered()).not.toThrow();
    expect(() => module.ensurePalettePrimitivesRegistered()).not.toThrow();
    expect(customElements.get('tini-input')).toBeTruthy();
    expect(customElements.get('tini-dialog')).toBeTruthy();
    expect(customElements.get('tini-spinner')).toBeTruthy();
  });
});
