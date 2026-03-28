import {describe, expect, it} from 'vitest';

import './tini-shortcut.js';

describe('tini-shortcut', () => {
  it('renders normalized modifier keys for a combo', async () => {
    const element = document.createElement('tini-shortcut') as HTMLElement & {
      keys: string;
      shadowRoot: ShadowRoot;
      updateComplete: Promise<void>;
    };

    element.keys = 'Ctrl+Shift+f';
    document.body.appendChild(element);

    await element.updateComplete;

    const renderedKeys = Array.from(
      element.shadowRoot.querySelectorAll('kbd')
    ).map(node => node.textContent);
    expect(renderedKeys).toEqual(['Ctrl', 'Shift', 'F']);
  });

  it('renders a sequence using the then marker', async () => {
    const element = document.createElement('tini-shortcut') as HTMLElement & {
      keys: string;
      shadowRoot: ShadowRoot;
      updateComplete: Promise<void>;
    };

    element.keys = 'g h';
    document.body.appendChild(element);

    await element.updateComplete;

    expect(element.shadowRoot.textContent).toContain('then');
    const renderedKeys = Array.from(
      element.shadowRoot.querySelectorAll('kbd')
    ).map(node => node.textContent);
    expect(renderedKeys).toEqual(['G', 'H']);
  });
});
