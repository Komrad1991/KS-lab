import {describe, expect, it} from 'vitest';

import './tini-command-item.js';

describe('tini-command-item', () => {
  it('renders command details, shortcut and args badge', async () => {
    const element = document.createElement(
      'tini-command-item'
    ) as HTMLElement & {
      command: {
        id: string;
        name: string;
        description?: string;
        args?: Array<{name: string; type: 'string'}>;
      };
      query: string;
      shortcut: string;
      shadowRoot: ShadowRoot;
      updateComplete: Promise<void>;
    };

    element.command = {
      id: 'search',
      name: 'Search Commands',
      description: 'Enter a search query',
      args: [{name: 'query', type: 'string'}],
    };
    element.query = 'search';
    element.shortcut = 'Ctrl+Shift+F';
    document.body.appendChild(element);

    await element.updateComplete;

    expect(element.shadowRoot.textContent).toContain('Search Commands');
    expect(element.shadowRoot.textContent).toContain('Enter a search query');
    expect(element.shadowRoot.textContent).toContain('Args');
    expect(element.shadowRoot.querySelector('mark')?.textContent).toBe(
      'Search'
    );
    expect(element.shadowRoot.querySelector('tini-shortcut')).toBeTruthy();
  });

  it('shows a spinner instead of shortcut while loading', async () => {
    const element = document.createElement(
      'tini-command-item'
    ) as HTMLElement & {
      command: {
        id: string;
        name: string;
      };
      loading: boolean;
      shortcut: string;
      shadowRoot: ShadowRoot;
      updateComplete: Promise<void>;
    };

    element.command = {
      id: 'async',
      name: 'Async Task',
    };
    element.shortcut = 'Ctrl+Shift+A';
    element.loading = true;
    document.body.appendChild(element);

    await element.updateComplete;

    expect(element.shadowRoot.querySelector('tini-spinner')).toBeTruthy();
    expect(element.shadowRoot.querySelector('tini-shortcut')).toBeFalsy();
  });
});
