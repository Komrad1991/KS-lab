import {css, html, nothing, type PropertyValues} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {property} from 'lit/decorators.js';
import {TiniComponent} from '@tinijs/core';
import {createStore} from '@tinijs/store';

import type {
  CommandArgument,
  CommandDefinition,
} from '../types/command-definition.js';
import {groupCommandsByCategory} from './command-grouping.js';
import {shouldClosePaletteAfterRun} from './command-run-behavior.js';
import {
  ensurePalettePrimitivesRegistered,
  type PaletteDialogComponent,
} from './palette-primitives.js';
import {
  coerceArgumentValue,
  createInitialArgumentValues,
  getArgumentCommand,
  moveSelectionIndex,
} from './palette-state.js';

type PaletteTheme = 'light' | 'dark';
type PaletteFamily =
  | 'tini'
  | 'bootstrap'
  | 'material'
  | 'ios'
  | 'fluent'
  | 'radix'
  | 'chakra'
  | 'daisy'
  | 'shadcn';

type CommandServiceLike = {
  getContext?: () => unknown;
  getRecentCommands?: (limit?: number) => CommandDefinition[];
  getShortcut?: (commandId: string) => string | undefined;
  runCommand: (
    id: string,
    args?: Record<string, unknown>,
    abortSignal?: AbortSignal
  ) => Promise<void>;
  searchCommands: (query: string, context?: unknown) => CommandDefinition[];
  subscribeContext?: (cb: (ctx: unknown) => void) => void;
};

type PaletteViewState = {
  opened: boolean;
  query: string;
  items: CommandDefinition[];
  selectedIndex: number;
  loadingCommandId: string;
  argsCommandId: string;
  argValues: Record<string, unknown>;
  errorMessage: string;
};

const FAMILY_STYLES: Record<
  PaletteFamily,
  Record<PaletteTheme, Record<string, string>>
> = {
  tini: {
    light: {
      '--cp-bg': '#ffffff',
      '--cp-fg': '#172033',
      '--cp-muted': '#667085',
      '--cp-overlay': 'rgba(10, 15, 30, 0.45)',
      '--cp-panel-border': '#d7deeb',
      '--cp-search-bg': '#f8fafc',
      '--cp-search-border': '#c9d4e5',
      '--cp-item-hover': '#eef4ff',
      '--cp-item-selected': '#dce9ff',
      '--cp-accent': '#2563eb',
      '--cp-badge-bg': '#e8f0ff',
      '--cp-shortcut-bg': '#edf2f7',
      '--cp-shortcut-fg': '#344054',
      '--cp-shadow': '0 24px 80px rgba(15, 23, 42, 0.18)',
    },
    dark: {
      '--cp-bg': '#0f172a',
      '--cp-fg': '#e2e8f0',
      '--cp-muted': '#94a3b8',
      '--cp-overlay': 'rgba(2, 6, 23, 0.72)',
      '--cp-panel-border': '#24324b',
      '--cp-search-bg': '#111c33',
      '--cp-search-border': '#314158',
      '--cp-item-hover': '#16233a',
      '--cp-item-selected': '#1d3357',
      '--cp-accent': '#60a5fa',
      '--cp-badge-bg': '#17305e',
      '--cp-shortcut-bg': '#1b2940',
      '--cp-shortcut-fg': '#dbe7ff',
      '--cp-shadow': '0 24px 80px rgba(2, 6, 23, 0.55)',
    },
  },
  bootstrap: {
    light: {
      '--cp-bg': '#ffffff',
      '--cp-fg': '#212529',
      '--cp-muted': '#6c757d',
      '--cp-overlay': 'rgba(33, 37, 41, 0.55)',
      '--cp-panel-border': '#dee2e6',
      '--cp-search-bg': '#f8f9fa',
      '--cp-search-border': '#ced4da',
      '--cp-item-hover': '#f1f3f5',
      '--cp-item-selected': '#cfe2ff',
      '--cp-accent': '#0d6efd',
      '--cp-badge-bg': '#e7f1ff',
      '--cp-shortcut-bg': '#e9ecef',
      '--cp-shortcut-fg': '#495057',
      '--cp-shadow': '0 1rem 3rem rgba(0, 0, 0, 0.18)',
    },
    dark: {
      '--cp-bg': '#212529',
      '--cp-fg': '#f8f9fa',
      '--cp-muted': '#adb5bd',
      '--cp-overlay': 'rgba(0, 0, 0, 0.72)',
      '--cp-panel-border': '#495057',
      '--cp-search-bg': '#2b3035',
      '--cp-search-border': '#495057',
      '--cp-item-hover': '#343a40',
      '--cp-item-selected': '#0d3b66',
      '--cp-accent': '#6ea8fe',
      '--cp-badge-bg': '#193d69',
      '--cp-shortcut-bg': '#343a40',
      '--cp-shortcut-fg': '#f8f9fa',
      '--cp-shadow': '0 1rem 3rem rgba(0, 0, 0, 0.45)',
    },
  },
  material: {
    light: {
      '--cp-bg': '#fef7ff',
      '--cp-fg': '#1d1b20',
      '--cp-muted': '#625b71',
      '--cp-overlay': 'rgba(29, 27, 32, 0.5)',
      '--cp-panel-border': '#e7def8',
      '--cp-search-bg': '#f3edf7',
      '--cp-search-border': '#cac4d0',
      '--cp-item-hover': '#ede7f6',
      '--cp-item-selected': '#d0bcff',
      '--cp-accent': '#6750a4',
      '--cp-badge-bg': '#eaddff',
      '--cp-shortcut-bg': '#ece6f0',
      '--cp-shortcut-fg': '#49454f',
      '--cp-shadow': '0 24px 48px rgba(103, 80, 164, 0.18)',
    },
    dark: {
      '--cp-bg': '#1c1b1f',
      '--cp-fg': '#e6e1e5',
      '--cp-muted': '#cac4d0',
      '--cp-overlay': 'rgba(0, 0, 0, 0.72)',
      '--cp-panel-border': '#49454f',
      '--cp-search-bg': '#2b2930',
      '--cp-search-border': '#625b71',
      '--cp-item-hover': '#2f2c35',
      '--cp-item-selected': '#4f378b',
      '--cp-accent': '#d0bcff',
      '--cp-badge-bg': '#4f378b',
      '--cp-shortcut-bg': '#332d41',
      '--cp-shortcut-fg': '#f4eff4',
      '--cp-shadow': '0 24px 48px rgba(0, 0, 0, 0.45)',
    },
  },
  ios: {
    light: {
      '--cp-bg': 'rgba(255, 255, 255, 0.86)',
      '--cp-fg': '#111827',
      '--cp-muted': '#6b7280',
      '--cp-overlay': 'rgba(15, 23, 42, 0.38)',
      '--cp-panel-border': 'rgba(255, 255, 255, 0.7)',
      '--cp-search-bg': 'rgba(255, 255, 255, 0.72)',
      '--cp-search-border': 'rgba(148, 163, 184, 0.35)',
      '--cp-item-hover': 'rgba(255, 255, 255, 0.72)',
      '--cp-item-selected': 'rgba(191, 219, 254, 0.85)',
      '--cp-accent': '#0a84ff',
      '--cp-badge-bg': '#dbeafe',
      '--cp-shortcut-bg': 'rgba(255, 255, 255, 0.75)',
      '--cp-shortcut-fg': '#1f2937',
      '--cp-shadow': '0 30px 90px rgba(15, 23, 42, 0.18)',
    },
    dark: {
      '--cp-bg': 'rgba(28, 28, 30, 0.88)',
      '--cp-fg': '#f5f5f7',
      '--cp-muted': '#c7c7cc',
      '--cp-overlay': 'rgba(0, 0, 0, 0.68)',
      '--cp-panel-border': 'rgba(99, 99, 102, 0.5)',
      '--cp-search-bg': 'rgba(58, 58, 60, 0.78)',
      '--cp-search-border': 'rgba(99, 99, 102, 0.55)',
      '--cp-item-hover': 'rgba(58, 58, 60, 0.85)',
      '--cp-item-selected': 'rgba(10, 132, 255, 0.35)',
      '--cp-accent': '#64d2ff',
      '--cp-badge-bg': 'rgba(10, 132, 255, 0.24)',
      '--cp-shortcut-bg': 'rgba(72, 72, 74, 0.85)',
      '--cp-shortcut-fg': '#f5f5f7',
      '--cp-shadow': '0 30px 90px rgba(0, 0, 0, 0.45)',
    },
  },
  fluent: {
    light: {
      '--cp-bg': '#ffffff',
      '--cp-fg': '#242424',
      '--cp-muted': '#616161',
      '--cp-overlay': 'rgba(0, 0, 0, 0.4)',
      '--cp-panel-border': '#d1d1d1',
      '--cp-search-bg': '#fafafa',
      '--cp-search-border': '#c7c7c7',
      '--cp-item-hover': '#f5f5f5',
      '--cp-item-selected': '#cfe4fa',
      '--cp-accent': '#0f6cbd',
      '--cp-badge-bg': '#deecf9',
      '--cp-shortcut-bg': '#f3f2f1',
      '--cp-shortcut-fg': '#323130',
      '--cp-shadow': '0 20px 48px rgba(0, 0, 0, 0.16)',
    },
    dark: {
      '--cp-bg': '#292929',
      '--cp-fg': '#ffffff',
      '--cp-muted': '#c8c8c8',
      '--cp-overlay': 'rgba(0, 0, 0, 0.65)',
      '--cp-panel-border': '#3d3d3d',
      '--cp-search-bg': '#333333',
      '--cp-search-border': '#4d4d4d',
      '--cp-item-hover': '#3b3a39',
      '--cp-item-selected': '#0f548c',
      '--cp-accent': '#5ea0ef',
      '--cp-badge-bg': '#113b5c',
      '--cp-shortcut-bg': '#3b3a39',
      '--cp-shortcut-fg': '#ffffff',
      '--cp-shadow': '0 20px 48px rgba(0, 0, 0, 0.4)',
    },
  },
  radix: {
    light: {
      '--cp-bg': '#ffffff',
      '--cp-fg': '#11181c',
      '--cp-muted': '#687076',
      '--cp-overlay': 'rgba(17, 24, 28, 0.48)',
      '--cp-panel-border': '#dfe3e6',
      '--cp-search-bg': '#f8fafb',
      '--cp-search-border': '#d7dbdf',
      '--cp-item-hover': '#f1f3f5',
      '--cp-item-selected': '#d9efff',
      '--cp-accent': '#0091ff',
      '--cp-badge-bg': '#e1f3ff',
      '--cp-shortcut-bg': '#eef1f3',
      '--cp-shortcut-fg': '#485058',
      '--cp-shadow': '0 24px 64px rgba(17, 24, 28, 0.16)',
    },
    dark: {
      '--cp-bg': '#111113',
      '--cp-fg': '#ecedee',
      '--cp-muted': '#b4b8bd',
      '--cp-overlay': 'rgba(0, 0, 0, 0.72)',
      '--cp-panel-border': '#272a2d',
      '--cp-search-bg': '#19191b',
      '--cp-search-border': '#2c2f32',
      '--cp-item-hover': '#202225',
      '--cp-item-selected': '#003362',
      '--cp-accent': '#52a9ff',
      '--cp-badge-bg': '#0d2840',
      '--cp-shortcut-bg': '#202225',
      '--cp-shortcut-fg': '#ecedee',
      '--cp-shadow': '0 24px 64px rgba(0, 0, 0, 0.5)',
    },
  },
  chakra: {
    light: {
      '--cp-bg': '#ffffff',
      '--cp-fg': '#1a202c',
      '--cp-muted': '#718096',
      '--cp-overlay': 'rgba(26, 32, 44, 0.48)',
      '--cp-panel-border': '#e2e8f0',
      '--cp-search-bg': '#f7fafc',
      '--cp-search-border': '#cbd5e0',
      '--cp-item-hover': '#edf2f7',
      '--cp-item-selected': '#bee3f8',
      '--cp-accent': '#3182ce',
      '--cp-badge-bg': '#ebf8ff',
      '--cp-shortcut-bg': '#edf2f7',
      '--cp-shortcut-fg': '#2d3748',
      '--cp-shadow': '0 24px 60px rgba(26, 32, 44, 0.14)',
    },
    dark: {
      '--cp-bg': '#171923',
      '--cp-fg': '#f7fafc',
      '--cp-muted': '#a0aec0',
      '--cp-overlay': 'rgba(0, 0, 0, 0.7)',
      '--cp-panel-border': '#2d3748',
      '--cp-search-bg': '#1f2733',
      '--cp-search-border': '#4a5568',
      '--cp-item-hover': '#2d3748',
      '--cp-item-selected': '#2b6cb0',
      '--cp-accent': '#63b3ed',
      '--cp-badge-bg': '#1a365d',
      '--cp-shortcut-bg': '#2d3748',
      '--cp-shortcut-fg': '#f7fafc',
      '--cp-shadow': '0 24px 60px rgba(0, 0, 0, 0.42)',
    },
  },
  daisy: {
    light: {
      '--cp-bg': '#ffffff',
      '--cp-fg': '#1f2937',
      '--cp-muted': '#6b7280',
      '--cp-overlay': 'rgba(17, 24, 39, 0.42)',
      '--cp-panel-border': '#e5e7eb',
      '--cp-search-bg': '#f9fafb',
      '--cp-search-border': '#d1d5db',
      '--cp-item-hover': '#f3f4f6',
      '--cp-item-selected': '#bfdbfe',
      '--cp-accent': '#2563eb',
      '--cp-badge-bg': '#dbeafe',
      '--cp-shortcut-bg': '#e5e7eb',
      '--cp-shortcut-fg': '#374151',
      '--cp-shadow': '0 24px 64px rgba(17, 24, 39, 0.16)',
    },
    dark: {
      '--cp-bg': '#1d232a',
      '--cp-fg': '#f3f4f6',
      '--cp-muted': '#9ca3af',
      '--cp-overlay': 'rgba(0, 0, 0, 0.68)',
      '--cp-panel-border': '#2a323c',
      '--cp-search-bg': '#191e24',
      '--cp-search-border': '#374151',
      '--cp-item-hover': '#2a323c',
      '--cp-item-selected': '#1d4ed8',
      '--cp-accent': '#60a5fa',
      '--cp-badge-bg': '#1e3a8a',
      '--cp-shortcut-bg': '#2a323c',
      '--cp-shortcut-fg': '#f3f4f6',
      '--cp-shadow': '0 24px 64px rgba(0, 0, 0, 0.45)',
    },
  },
  shadcn: {
    light: {
      '--cp-bg': '#ffffff',
      '--cp-fg': '#020817',
      '--cp-muted': '#64748b',
      '--cp-overlay': 'rgba(2, 8, 23, 0.42)',
      '--cp-panel-border': '#e2e8f0',
      '--cp-search-bg': '#f8fafc',
      '--cp-search-border': '#cbd5e1',
      '--cp-item-hover': '#f1f5f9',
      '--cp-item-selected': '#dbeafe',
      '--cp-accent': '#0f172a',
      '--cp-badge-bg': '#eff6ff',
      '--cp-shortcut-bg': '#f1f5f9',
      '--cp-shortcut-fg': '#334155',
      '--cp-shadow': '0 24px 64px rgba(15, 23, 42, 0.14)',
    },
    dark: {
      '--cp-bg': '#020817',
      '--cp-fg': '#f8fafc',
      '--cp-muted': '#94a3b8',
      '--cp-overlay': 'rgba(2, 8, 23, 0.72)',
      '--cp-panel-border': '#1e293b',
      '--cp-search-bg': '#0f172a',
      '--cp-search-border': '#334155',
      '--cp-item-hover': '#111827',
      '--cp-item-selected': '#1d4ed8',
      '--cp-accent': '#e2e8f0',
      '--cp-badge-bg': '#1e3a8a',
      '--cp-shortcut-bg': '#0f172a',
      '--cp-shortcut-fg': '#e2e8f0',
      '--cp-shadow': '0 24px 64px rgba(2, 8, 23, 0.55)',
    },
  },
};

export class TiniCommandPalette extends TiniComponent {
  static override styles = css`
    :host {
      display: block;
    }

    tini-dialog {
      --width: min(760px, 96vw);
    }

    .dialog-shell::part(main) {
      border: none;
      background: transparent;
      box-shadow: none;
      width: min(760px, 96vw);
      max-width: min(760px, 96vw);
      overflow: visible;
    }

    .dialog-shell::part(head) {
      display: none;
    }

    .dialog-shell::part(body) {
      padding: 0;
      overflow: visible;
    }

    .dialog-shell::part(foot) {
      display: none;
    }

    .panel {
      width: min(760px, 96vw);
      max-height: min(78vh, 820px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      background: var(--cp-bg);
      color: var(--cp-fg);
      border: 1px solid var(--cp-panel-border);
      border-radius: 24px;
      box-shadow: var(--cp-shadow);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      color: var(--cp-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .header-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .header-status tini-spinner,
    .button-spinner {
      --color: var(--cp-accent);
      --size: 8px;
    }

    #palette-search {
      display: block;
      width: 100%;
      min-width: 0;
    }

    #palette-search::part(main) {
      display: flex;
      width: 100%;
    }

    #palette-search::part(input) {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--cp-search-border);
      border-radius: 16px;
      background: var(--cp-search-bg);
      color: var(--cp-fg);
      padding: 14px 16px;
      font-size: 16px;
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    #palette-search::part(input):focus {
      border-color: var(--cp-accent);
      box-shadow: 0 0 0 4px
        color-mix(in srgb, var(--cp-accent) 16%, transparent);
      transform: translateY(-1px);
    }

    .content {
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .group {
      display: grid;
      gap: 8px;
    }

    .group-title {
      padding: 0 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--cp-muted);
    }

    .group-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .empty {
      padding: 18px;
      color: var(--cp-muted);
      text-align: center;
      border: 1px dashed var(--cp-panel-border);
      border-radius: 18px;
    }

    .args {
      border-top: 1px solid var(--cp-panel-border);
      padding-top: 12px;
      display: grid;
      gap: 12px;
    }

    .args-title {
      font-weight: 600;
      font-size: 14px;
    }

    .arg-grid {
      display: grid;
      gap: 10px;
    }

    label {
      display: grid;
      gap: 6px;
      font-size: 13px;
      color: var(--cp-muted);
    }

    input,
    select {
      border: 1px solid var(--cp-search-border);
      border-radius: 12px;
      background: var(--cp-search-bg);
      color: var(--cp-fg);
      padding: 12px 14px;
      font-size: 14px;
      outline: none;
    }

    input:focus,
    select:focus {
      border-color: var(--cp-accent);
      box-shadow: 0 0 0 4px
        color-mix(in srgb, var(--cp-accent) 16%, transparent);
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      font-size: 14px;
      cursor: pointer;
      transition:
        transform 0.2s ease,
        opacity 0.2s ease;
    }

    button:hover {
      transform: translateY(-1px);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
      transform: none;
    }

    .button-content {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .primary {
      background: var(--cp-accent);
      color: white;
    }

    .ghost {
      background: var(--cp-shortcut-bg);
      color: var(--cp-shortcut-fg);
    }

    .error {
      padding: 10px 12px;
      border-radius: 14px;
      background: color-mix(in srgb, #ef4444 14%, transparent);
      color: #ef4444;
      font-size: 13px;
    }

    @media (max-width: 640px) {
      tini-dialog {
        --width: calc(100vw - 24px);
      }

      .panel {
        width: 100%;
        max-height: 84vh;
        padding: 14px;
        border-radius: 18px;
      }
    }
  `;

  @property({attribute: false})
  commandService?: CommandServiceLike;

  @property({type: String, reflect: true})
  theme: PaletteTheme = 'light';

  @property({type: String, reflect: true})
  family: PaletteFamily = 'tini';

  private abortController?: AbortController;
  private readonly dialogRef = createRef<PaletteDialogComponent>();
  private readonly stateStore = createStore<PaletteViewState>({
    opened: false,
    query: '',
    items: [],
    selectedIndex: 0,
    loadingCommandId: '',
    argsCommandId: '',
    argValues: {},
    errorMessage: '',
  });
  private readonly globalKeyHandler = (event: KeyboardEvent) =>
    this.handleGlobalKeyDown(event);
  private readonly globalKeyListenerOptions = {capture: true};
  private readonly contextSubscriber = () => this.refreshCommands();
  private readonly handledGlobalEvents = new WeakSet<KeyboardEvent>();
  private readonly storeUnsubscribes: Array<() => void> = [];
  private subscribedService?: CommandServiceLike;

  private get opened() {
    return this.stateStore.opened;
  }

  private set opened(value: boolean) {
    this.stateStore.commit('opened', value);
  }

  private get query() {
    return this.stateStore.query;
  }

  private set query(value: string) {
    this.stateStore.commit('query', value);
  }

  private get items() {
    return this.stateStore.items;
  }

  private set items(value: CommandDefinition[]) {
    this.stateStore.commit('items', value);
  }

  private get selectedIndex() {
    return this.stateStore.selectedIndex;
  }

  private set selectedIndex(value: number) {
    this.stateStore.commit('selectedIndex', value);
  }

  private get loadingCommandId() {
    return this.stateStore.loadingCommandId;
  }

  private set loadingCommandId(value: string) {
    this.stateStore.commit('loadingCommandId', value);
  }

  private get argsCommandId() {
    return this.stateStore.argsCommandId;
  }

  private set argsCommandId(value: string) {
    this.stateStore.commit('argsCommandId', value);
  }

  private get argValues() {
    return this.stateStore.argValues;
  }

  private set argValues(value: Record<string, unknown>) {
    this.stateStore.commit('argValues', value);
  }

  private get errorMessage() {
    return this.stateStore.errorMessage;
  }

  private set errorMessage(value: string) {
    this.stateStore.commit('errorMessage', value);
  }

  connectedCallback() {
    super.connectedCallback();
    ensurePalettePrimitivesRegistered();
    this.subscribeToStore();
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'keydown',
        this.globalKeyHandler,
        this.globalKeyListenerOptions
      );
    }
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'keydown',
        this.globalKeyHandler,
        this.globalKeyListenerOptions
      );
    }
    this.subscribeToService();
    this.refreshCommands();
  }

  disconnectedCallback() {
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'keydown',
        this.globalKeyHandler,
        this.globalKeyListenerOptions
      );
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'keydown',
        this.globalKeyHandler,
        this.globalKeyListenerOptions
      );
    }
    this.abortController?.abort();
    this.unsubscribeFromStore();
    super.disconnectedCallback();
  }

  protected override updated(changedProperties: PropertyValues<this>) {
    super.updated(changedProperties);

    if (
      changedProperties.has('commandService') ||
      changedProperties.has('theme') ||
      changedProperties.has('family')
    ) {
      this.subscribeToService();
      this.setHostStyles(FAMILY_STYLES[this.family][this.theme]);
      if (changedProperties.has('commandService')) {
        this.refreshCommands();
      }
    }
    this.syncDialogVisibility();
  }

  open(): void {
    this.opened = true;
    this.errorMessage = '';
    this.refreshCommands();
    this.updateComplete.then(() => {
      this.syncDialogVisibility();
      this.focusSearch();
    });
  }

  close(): void {
    this.abortController?.abort();
    this.abortController = undefined;
    this.loadingCommandId = '';
    this.argsCommandId = '';
    this.argValues = {};
    this.errorMessage = '';
    this.opened = false;
    this.updateComplete.then(() => this.syncDialogVisibility());
  }

  protected render() {
    const currentArgsCommand = getArgumentCommand(
      this.items,
      this.argsCommandId
    );
    const groups = groupCommandsByCategory(this.items);

    return html`
      <tini-dialog
        ${ref(this.dialogRef)}
        class="dialog-shell"
        titleText="Command Palette"
        ?backdropDismissal=${true}
        @action=${this.handleDialogAction}
      >
        <div slot="foot"></div>
        <section
          class="panel"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div class="header">
            <span>Command Palette</span>
            <span class="header-status">
              ${this.loadingCommandId
                ? html`
                    <tini-spinner
                      aria-hidden="true"
                      data-testid="palette-loading-indicator"
                    ></tini-spinner>
                    <span>Выполняется команда…</span>
                  `
                : html`<span>${this.family} / ${this.theme}</span>`}
            </span>
          </div>
          <tini-input
            id="palette-search"
            ?block=${true}
            placeholder="Поиск команд..."
            .value=${this.query}
            type="text"
            autocomplete="off"
            @input=${this.handleSearchInput}
          ></tini-input>
          ${this.errorMessage
            ? html`<div class="error" role="alert">${this.errorMessage}</div>`
            : nothing}
          <div class="content">
            <div class="list" role="listbox" aria-label="Список команд">
              ${this.items.length
                ? groups.map(
                    group => html`
                      <section class="group" aria-label=${group.category}>
                        <div class="group-title">${group.category}</div>
                        <ul class="group-list">
                          ${group.entries.map(({command, index}) =>
                            this.renderCommand(command, index)
                          )}
                        </ul>
                      </section>
                    `
                  )
                : html`<div class="empty">Команды не найдены.</div>`}
            </div>
            ${!currentArgsCommand
              ? nothing
              : html`
                  <div class="args">
                    <div class="args-title">
                      Аргументы для команды «${currentArgsCommand.name}»
                    </div>
                    <div class="arg-grid">
                      ${currentArgsCommand.args?.map(argument =>
                        this.renderArgumentField(argument)
                      )}
                    </div>
                    <div class="actions">
                      <button
                        class="primary"
                        type="button"
                        ?disabled=${this.loadingCommandId ===
                        currentArgsCommand.id}
                        @click=${() =>
                          this.executeCommand(
                            currentArgsCommand,
                            this.argValues
                          )}
                      >
                        <span class="button-content">
                          ${this.loadingCommandId === currentArgsCommand.id
                            ? html`
                                <tini-spinner
                                  class="button-spinner"
                                  aria-hidden="true"
                                ></tini-spinner>
                              `
                            : nothing}
                          <span>
                            ${this.loadingCommandId === currentArgsCommand.id
                              ? 'Выполняется...'
                              : 'Запустить'}
                          </span>
                        </span>
                      </button>
                      <button
                        class="ghost"
                        type="button"
                        ?disabled=${this.loadingCommandId ===
                        currentArgsCommand.id}
                        @click=${this.cancelArgsForm}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                `}
          </div>
        </section>
      </tini-dialog>
    `;
  }

  private renderCommand(command: CommandDefinition, index: number) {
    const shortcut = this.commandService?.getShortcut?.(command.id) ?? '';
    const selected = index === this.selectedIndex;
    const loading = this.loadingCommandId === command.id;

    return html`
      <li role="option" aria-selected=${selected ? 'true' : 'false'}>
        <tini-command-item
          .command=${command}
          .query=${this.query}
          .shortcut=${shortcut}
          .selected=${selected}
          .loading=${loading}
          @click=${() => this.activateCommand(command)}
        ></tini-command-item>
      </li>
    `;
  }

  private renderArgumentField(argument: CommandArgument) {
    const value = this.argValues[argument.name];

    return html`
      <label>
        <span
          >${argument.name}${argument.description
            ? `: ${argument.description}`
            : ''}</span
        >
        ${argument.type === 'select' && argument.options?.length
          ? html`
              <select
                .value=${String(value ?? argument.options[0] ?? '')}
                @change=${(event: Event) =>
                  this.updateArgument(
                    argument,
                    (event.target as HTMLSelectElement).value
                  )}
              >
                ${argument.options.map(
                  option => html`<option value=${option}>${option}</option>`
                )}
              </select>
            `
          : html`
              <input
                type=${argument.type === 'number' ? 'number' : 'text'}
                .value=${value === null || value === undefined
                  ? ''
                  : String(value)}
                @input=${(event: Event) =>
                  this.updateArgument(
                    argument,
                    (event.target as HTMLInputElement).value
                  )}
                @keydown=${(event: KeyboardEvent) =>
                  this.handleArgsKeydown(event)}
              />
            `}
      </label>
    `;
  }

  private subscribeToService(): void {
    if (
      !this.commandService ||
      this.subscribedService === this.commandService ||
      !this.commandService.subscribeContext
    ) {
      return;
    }

    this.commandService.subscribeContext(this.contextSubscriber);
    this.subscribedService = this.commandService;
  }

  private subscribeToStore(): void {
    if (this.storeUnsubscribes.length) {
      return;
    }

    (
      [
        'opened',
        'query',
        'items',
        'selectedIndex',
        'loadingCommandId',
        'argsCommandId',
        'argValues',
        'errorMessage',
      ] as const
    ).forEach(key => {
      this.storeUnsubscribes.push(
        this.stateStore.subscribe(key, () => this.requestUpdate())
      );
    });
  }

  private unsubscribeFromStore(): void {
    this.storeUnsubscribes.splice(0).forEach(unsubscribe => unsubscribe());
  }

  private refreshCommands(): void {
    const context = this.commandService?.getContext?.();
    const query = this.query.trim();
    const results = this.commandService?.searchCommands(query, context) ?? [];

    if (!query) {
      const recent = this.commandService?.getRecentCommands?.(5) ?? [];
      const deduped = new Map<string, CommandDefinition>();
      [...recent, ...results].forEach(command =>
        deduped.set(command.id, command)
      );
      this.items = Array.from(deduped.values());
    } else {
      this.items = results;
    }

    if (!this.items.length) {
      this.selectedIndex = 0;
      return;
    }

    if (this.selectedIndex >= this.items.length) {
      this.selectedIndex = this.items.length - 1;
    }
  }

  private focusSearch(): void {
    this.updateComplete.then(() => {
      const search = this.getSearchInputElement();
      search?.focus();
      search?.select();
    });
  }

  private handleSearchInput(event: Event): void {
    const target = event.composedPath()[0] ?? event.target;
    this.query =
      target instanceof HTMLInputElement
        ? target.value
        : String((target as {value?: string}).value ?? '');
    this.selectedIndex = 0;
    this.errorMessage = '';
    this.refreshCommands();
  }

  private handleDialogAction = (): void => {
    if (!this.opened || this.loadingCommandId) {
      return;
    }
    this.close();
  };

  private handleGlobalKeyDown(event: KeyboardEvent): void {
    if (this.handledGlobalEvents.has(event)) {
      return;
    }
    this.handledGlobalEvents.add(event);

    const isMac =
      typeof navigator !== 'undefined' &&
      navigator.platform.toLowerCase().includes('mac');
    const modifierPressed = isMac ? event.metaKey : event.ctrlKey;

    if (
      modifierPressed &&
      (event.key.toLowerCase() === 'k' ||
        (event.shiftKey && event.key.toLowerCase() === 'p'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.open();
      return;
    }

    if (!this.opened) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.loadingCommandId && this.abortController) {
        this.abortController.abort();
        return;
      }
      if (this.argsCommandId) {
        this.cancelArgsForm();
        return;
      }
      this.close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveSelection(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveSelection(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.argsCommandId) {
        const command = getArgumentCommand(this.items, this.argsCommandId);
        if (command) void this.executeCommand(command, this.argValues);
        return;
      }

      const command = this.items[this.selectedIndex];
      if (command) this.activateCommand(command);
    }
  }

  private handleArgsKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || !this.argsCommandId) return;
    event.preventDefault();
    const command = getArgumentCommand(this.items, this.argsCommandId);
    if (command) void this.executeCommand(command, this.argValues);
  }

  private moveSelection(delta: number): void {
    this.selectedIndex = moveSelectionIndex(
      this.selectedIndex,
      this.items.length,
      delta
    );
  }

  private activateCommand(command: CommandDefinition): void {
    this.errorMessage = '';

    if (command.args?.length) {
      this.argsCommandId = command.id;
      this.argValues = this.createInitialArgValues(command.args);
      this.updateComplete.then(() => {
        const firstField = this.renderRoot.querySelector<
          HTMLInputElement | HTMLSelectElement
        >('.args input, .args select');
        firstField?.focus();
      });
      return;
    }

    void this.executeCommand(command);
  }

  private createInitialArgValues(
    args: CommandArgument[]
  ): Record<string, unknown> {
    return createInitialArgumentValues(args);
  }

  private updateArgument(argument: CommandArgument, rawValue: string): void {
    this.argValues = {
      ...this.argValues,
      [argument.name]: coerceArgumentValue(argument, rawValue),
    };
  }

  private cancelArgsForm = (): void => {
    this.argsCommandId = '';
    this.argValues = {};
    this.errorMessage = '';
  };

  private getSearchInputElement(): HTMLInputElement | null {
    const host = this.renderRoot.querySelector<HTMLElement>('#palette-search');
    return host?.shadowRoot?.querySelector('input') ?? null;
  }

  private syncDialogVisibility(): void {
    const dialog = this.dialogRef.value;
    if (!dialog) {
      return;
    }

    if (this.opened && !dialog.isOpened) {
      dialog.show();
      return;
    }

    if (!this.opened && dialog.isOpened) {
      dialog.hide();
    }
  }

  private async executeCommand(
    command: CommandDefinition,
    args?: Record<string, unknown>
  ): Promise<void> {
    if (!this.commandService) return;

    this.errorMessage = '';
    this.loadingCommandId = command.id;
    this.abortController = new AbortController();

    try {
      await this.commandService.runCommand(
        command.id,
        args,
        this.abortController.signal
      );
      if (shouldClosePaletteAfterRun(command)) {
        this.close();
      } else {
        this.loadingCommandId = '';
        this.argsCommandId = '';
        this.argValues = {};
        this.errorMessage = '';
        this.refreshCommands();
        this.focusSearch();
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        this.errorMessage =
          error instanceof Error
            ? error.message
            : 'Не удалось выполнить команду.';
      }
    } finally {
      this.loadingCommandId = '';
      this.abortController = undefined;
    }
  }
}

customElements.define('tini-command-palette', TiniCommandPalette);
