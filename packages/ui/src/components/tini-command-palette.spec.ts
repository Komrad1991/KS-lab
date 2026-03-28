import {describe, expect, it, vi, afterEach} from 'vitest';

import './tini-command-palette.js';

type TestCommand = {
  id: string;
  name: string;
  description?: string;
  action: () => void;
  args?: Array<{name: string; type: 'string'}>;
};

class TestCommandService {
  constructor(
    readonly commands: TestCommand[],
    readonly runCommand: (
      id: string,
      args?: unknown,
      signal?: AbortSignal
    ) => Promise<void> = vi.fn(async () => {})
  ) {}

  searchCommands(query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return this.commands;
    }
    return this.commands.filter(command =>
      command.name.toLowerCase().includes(normalized)
    );
  }

  getRecentCommands() {
    return [];
  }

  getShortcut(commandId: string) {
    return commandId === 'hello' ? 'Ctrl+Shift+H' : undefined;
  }

  getContext() {
    return undefined;
  }
}

async function flushUpdates() {
  await Promise.resolve();
  await Promise.resolve();
}

async function openPalette(
  palette: HTMLElement & {updateComplete: Promise<void>}
) {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {key: 'k', ctrlKey: true, bubbles: true})
  );
  await palette.updateComplete;
  await flushUpdates();
}

function getDialog(
  palette: HTMLElement & {shadowRoot: ShadowRoot}
): HTMLElement & {shadowRoot: ShadowRoot} {
  return palette.shadowRoot.querySelector('tini-dialog') as HTMLElement & {
    shadowRoot: ShadowRoot;
  };
}

function getInnerDialog(
  palette: HTMLElement & {shadowRoot: ShadowRoot}
): HTMLDialogElement {
  return getDialog(palette).shadowRoot.querySelector(
    'dialog'
  ) as HTMLDialogElement;
}

function getSearchInput(
  palette: HTMLElement & {shadowRoot: ShadowRoot}
): HTMLInputElement {
  const inputHost = palette.shadowRoot.querySelector(
    '#palette-search'
  ) as HTMLElement & {shadowRoot: ShadowRoot};
  return inputHost.shadowRoot.querySelector('input') as HTMLInputElement;
}

function getSearchInputHost(
  palette: HTMLElement & {shadowRoot: ShadowRoot}
): HTMLElement & {shadowRoot: ShadowRoot} {
  return palette.shadowRoot.querySelector('#palette-search') as HTMLElement & {
    shadowRoot: ShadowRoot;
  };
}

function getCommandItems(palette: HTMLElement & {shadowRoot: ShadowRoot}) {
  return Array.from(
    palette.shadowRoot.querySelectorAll('tini-command-item')
  ) as Array<HTMLElement & {shadowRoot: ShadowRoot}>;
}

function createPalette(service: TestCommandService) {
  const palette = document.createElement(
    'tini-command-palette'
  ) as HTMLElement & {
    commandService: TestCommandService;
    updateComplete: Promise<void>;
    shadowRoot: ShadowRoot;
  };
  palette.commandService = service;
  document.body.appendChild(palette);
  return palette;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('tini-command-palette', () => {
  it('opens on Ctrl+K and renders available commands', async () => {
    const palette = createPalette(
      new TestCommandService([
        {id: 'hello', name: 'Say Hello', action: () => {}},
        {id: 'search', name: 'Search Commands', action: () => {}},
      ])
    );

    await palette.updateComplete;
    await openPalette(palette);

    const items = getCommandItems(palette);

    expect(getInnerDialog(palette).open).toBe(true);
    expect(items).toHaveLength(2);
  });

  it('moves selection and executes the selected command on Enter', async () => {
    const runCommand = vi.fn(async () => {});
    const palette = createPalette(
      new TestCommandService(
        [
          {id: 'hello', name: 'Say Hello', action: () => {}},
          {id: 'async', name: 'Async Task', action: () => {}},
        ],
        runCommand
      )
    );

    await palette.updateComplete;
    await openPalette(palette);
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true})
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})
    );
    await flushUpdates();

    expect(runCommand).toHaveBeenCalledTimes(1);
    expect(runCommand).toHaveBeenCalledWith(
      'async',
      undefined,
      expect.anything()
    );
  });

  it('opens an args form instead of executing immediately for arg commands', async () => {
    const runCommand = vi.fn(async () => {});
    const palette = createPalette(
      new TestCommandService(
        [
          {
            id: 'search',
            name: 'Search Commands',
            action: () => {},
            args: [{name: 'query', type: 'string'}],
          },
        ],
        runCommand
      )
    );

    await palette.updateComplete;
    await openPalette(palette);
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})
    );
    await palette.updateComplete;
    await flushUpdates();

    expect(runCommand).not.toHaveBeenCalled();
    expect(palette.shadowRoot.textContent).toContain('Аргументы для команды');
    expect(palette.shadowRoot.textContent).toContain('query');
  });

  it('filters commands when typing in the search input', async () => {
    const palette = createPalette(
      new TestCommandService([
        {id: 'hello', name: 'Say Hello', action: () => {}},
        {id: 'async', name: 'Async Task', action: () => {}},
      ])
    );

    await palette.updateComplete;
    await openPalette(palette);

    const searchInput = getSearchInput(palette);
    searchInput.value = 'hello';
    searchInput.dispatchEvent(
      new Event('input', {bubbles: true, composed: true})
    );
    await palette.updateComplete;
    await flushUpdates();

    const items = getCommandItems(palette);
    expect(items).toHaveLength(1);
  });

  it('renders the search input in block mode for correct layout', async () => {
    const palette = createPalette(
      new TestCommandService([
        {id: 'hello', name: 'Say Hello', action: () => {}},
      ])
    );

    await palette.updateComplete;

    expect(getSearchInputHost(palette).hasAttribute('block')).toBe(true);
  });

  it('closes on Escape when no command is running', async () => {
    const palette = createPalette(
      new TestCommandService([
        {id: 'hello', name: 'Say Hello', action: () => {}},
      ])
    );

    await palette.updateComplete;
    await openPalette(palette);

    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
    await palette.updateComplete;
    await flushUpdates();

    expect(getInnerDialog(palette).open).toBe(false);
  });

  it('closes when the dialog emits its dismiss action', async () => {
    const palette = createPalette(
      new TestCommandService([
        {id: 'hello', name: 'Say Hello', action: () => {}},
      ])
    );

    await palette.updateComplete;
    await openPalette(palette);

    getDialog(palette).dispatchEvent(new CustomEvent('action'));
    await palette.updateComplete;
    await flushUpdates();

    expect(getInnerDialog(palette).open).toBe(false);
  });

  it('aborts a running async command on Escape', async () => {
    let capturedSignal: AbortSignal | undefined;
    const runCommand = vi.fn(
      (_id: string, _args: unknown, signal?: AbortSignal) =>
        new Promise<void>((_, reject) => {
          capturedSignal = signal;
          signal?.addEventListener(
            'abort',
            () =>
              reject(
                Object.assign(new Error('Command aborted'), {
                  name: 'AbortError',
                })
              ),
            {once: true}
          );
        })
    );
    const palette = createPalette(
      new TestCommandService(
        [{id: 'async', name: 'Async Task', action: () => {}}],
        runCommand
      )
    );

    await palette.updateComplete;
    await openPalette(palette);
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})
    );
    await flushUpdates();

    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
    await flushUpdates();

    expect(capturedSignal?.aborted).toBe(true);
    expect(getInnerDialog(palette).open).toBe(true);
  });

  it('submits entered argument values from the args form', async () => {
    const runCommand = vi.fn(async () => {});
    const palette = createPalette(
      new TestCommandService(
        [
          {
            id: 'search',
            name: 'Search Commands',
            action: () => {},
            args: [{name: 'query', type: 'string'}],
          },
        ],
        runCommand
      )
    );

    await palette.updateComplete;
    await openPalette(palette);
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})
    );
    await palette.updateComplete;

    const argInput = palette.shadowRoot.querySelector(
      '.args input'
    ) as HTMLInputElement;
    argInput.value = 'docs';
    argInput.dispatchEvent(new Event('input', {bubbles: true}));
    await palette.updateComplete;

    const submitButton = palette.shadowRoot.querySelector(
      '.args .primary'
    ) as HTMLButtonElement;
    submitButton.click();
    await flushUpdates();

    expect(runCommand).toHaveBeenCalledTimes(1);
    expect(runCommand).toHaveBeenCalledWith(
      'search',
      {query: 'docs'},
      expect.anything()
    );
  });
});
