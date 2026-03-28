import type {
  CommandAction,
  CommandArgs,
  CommandContext,
  CommandDefinition,
  ShortcutDefinition,
} from './definition.js';
import {fuzzyScore} from './fuzzy.js';
import CommandHistoryStore from './history.js';
import {HotkeyManager} from './hotkeys.js';

type RegisteredShortcut = Required<ShortcutDefinition> & {
  order: number;
  normalizedKeys: string;
};

function normalizeShortcutKeys(keys: string): string {
  const trimmed = keys.trim();
  if (trimmed.includes(' ')) {
    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part.toLowerCase())
      .join(' ');
  }

  return trimmed
    .split('+')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => (part.length === 1 ? part.toUpperCase() : part))
    .join('+')
    .toLowerCase();
}

export class CommandService {
  private commands: Map<string, CommandDefinition> = new Map();
  private shortcuts = new Map<string, RegisteredShortcut[]>();
  private shortcutsRev = new Map<string, string>();
  private contextSubscribers: Array<(ctx: CommandContext) => void> = [];
  private currentContext: CommandContext = null;
  private history: CommandHistoryStore;
  private hotkeys: HotkeyManager;
  private shortcutRegistrationOrder = 0;

  constructor() {
    this.history = new CommandHistoryStore();
    this.hotkeys = new HotkeyManager(this);
  }

  registerCommand(
    id: string,
    name: string,
    description?: string,
    icon?: string,
    action?: CommandAction,
    keywords?: string[],
    category?: string,
    shouldShow?: (context: CommandContext) => boolean,
    args?: CommandDefinition['args'],
    closeOnRun = true
  ): void {
    const cmd: CommandDefinition = {
      id,
      name,
      description,
      icon,
      action: action ?? (() => Promise.resolve()),
      keywords,
      category,
      shouldShow,
      args,
      closeOnRun,
    };
    this.commands.set(id, cmd);
  }

  unregisterCommand(id: string): void {
    this.commands.delete(id);
    const registeredShortcut = this.shortcutsRev.get(id);
    if (registeredShortcut) {
      this.unregisterShortcut(registeredShortcut, id);
    }
    this.shortcutsRev.delete(id);
  }

  getRegisteredCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(): Map<string, CommandDefinition[]> {
    const map = new Map<string, CommandDefinition[]>();
    for (const cmd of this.commands.values()) {
      const cat = cmd.category ?? 'Uncategorized';
      const list = map.get(cat) ?? [];
      list.push(cmd);
      map.set(cat, list);
    }
    return map;
  }

  searchCommands(query: string, context?: CommandContext): CommandDefinition[] {
    let list = this.getRegisteredCommands();
    if (context === null || context === undefined)
      context = this.currentContext;
    list = list.filter(cmd => {
      if (typeof cmd.shouldShow === 'function') {
        try {
          const res = cmd.shouldShow(context);
          return typeof res === 'boolean' ? res : true;
        } catch {
          return false;
        }
      }
      return true;
    });

    const history = this.history.getAll();
    const historyIndex = new Map(history.map((id, index) => [id, index]));

    if (!query) {
      return list.sort((a, b) => {
        const ai = historyIndex.get(a.id);
        const bi = historyIndex.get(b.id);
        if (ai !== undefined && bi !== undefined) return ai - bi;
        if (ai !== undefined) return -1;
        if (bi !== undefined) return 1;
        const aUsage = this.history.getUsageCount(a.id);
        const bUsage = this.history.getUsageCount(b.id);
        if (bUsage !== aUsage) return bUsage - aUsage;
        return a.name.localeCompare(b.name);
      });
    }

    const scored = list
      .map(cmd => {
        const text = `${cmd.name} ${cmd.description ?? ''} ${(
          cmd.keywords ?? []
        ).join(' ')}`.trim();
        const score = fuzzyScore(query, text);
        const index = historyIndex.get(cmd.id);
        const recencyBoost = index === undefined ? 0 : 50 - Math.min(index, 49);
        const usageBoost = this.history.getUsageCount(cmd.id) * 25;
        return {cmd, score, recencyBoost, usageBoost};
      })
      .filter(x => x.score > 0)
      .sort((a, b) => {
        const weightedA = a.score + a.recencyBoost + a.usageBoost;
        const weightedB = b.score + b.recencyBoost + b.usageBoost;
        if (weightedB !== weightedA) {
          return weightedB - weightedA;
        }
        return a.cmd.name.localeCompare(b.cmd.name);
      });
    return scored.map(x => x.cmd);
  }

  registerShortcut(
    keys: string,
    commandId: string,
    preventDefault = false,
    priority = 0
  ): void {
    const normalizedKeys = normalizeShortcutKeys(keys);
    const previousKeys = this.shortcutsRev.get(commandId);
    if (previousKeys && previousKeys !== normalizedKeys) {
      this.unregisterShortcut(previousKeys, commandId);
    }

    const currentEntries = this.shortcuts.get(normalizedKeys) ?? [];
    const nextEntry: RegisteredShortcut = {
      keys,
      commandId,
      preventDefault,
      priority,
      order: ++this.shortcutRegistrationOrder,
      normalizedKeys,
    };

    this.shortcuts.set(
      normalizedKeys,
      currentEntries
        .filter(entry => entry.commandId !== commandId)
        .concat(nextEntry)
    );
    this.shortcutsRev.set(commandId, normalizedKeys);
    this.hotkeys.registerShortcut(keys, commandId, preventDefault, priority);
  }

  unregisterShortcut(keys: string, commandId?: string): void {
    const normalizedKeys = normalizeShortcutKeys(keys);
    if (!commandId) {
      const removedEntries = this.shortcuts.get(normalizedKeys) ?? [];
      removedEntries.forEach(entry =>
        this.shortcutsRev.delete(entry.commandId)
      );
      this.shortcuts.delete(normalizedKeys);
      this.hotkeys.unregisterShortcut(keys);
      return;
    }

    const mappedEntries = this.shortcuts.get(normalizedKeys);
    if (!mappedEntries?.length) {
      return;
    }

    const filteredEntries = mappedEntries.filter(
      entry => entry.commandId !== commandId
    );
    if (filteredEntries.length !== mappedEntries.length) {
      if (filteredEntries.length) {
        this.shortcuts.set(normalizedKeys, filteredEntries);
      } else {
        this.shortcuts.delete(normalizedKeys);
      }
      this.shortcutsRev.delete(commandId);
      this.hotkeys.unregisterShortcut(keys, commandId);
    }
  }

  subscribeContext(cb: (ctx: CommandContext) => void): void {
    this.contextSubscribers.push(cb);
  }

  getContext(): CommandContext {
    return this.currentContext;
  }

  updateContext(ctx: CommandContext): void {
    this.currentContext = ctx;
    for (const cb of this.contextSubscribers) cb(ctx);
  }

  getRecentCommands(limit = 10): CommandDefinition[] {
    const recentIds = this.history.getAll().slice(0, limit);
    return recentIds
      .map(id => this.commands.get(id))
      .filter(c => c !== undefined) as CommandDefinition[];
  }

  markCommandUsed(id: string): void {
    this.history.add(id);
  }

  async runCommand(
    id: string,
    args?: CommandArgs,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const cmd = this.commands.get(id);
    if (!cmd) throw new Error(`Command not found: ${id}`);
    const mergedSignal = abortSignal ?? new AbortController().signal;

    const result = cmd.action?.(args, mergedSignal);
    await this.awaitWithCancel(result, mergedSignal);

    try {
      this.markCommandUsed(id);
    } catch {
      // ignore history write errors
    }
  }

  private async awaitWithCancel(
    promise: Promise<void> | void,
    signal: AbortSignal
  ): Promise<void> {
    if (!(promise instanceof Promise)) return;

    if (signal.aborted) {
      throw this.createAbortError();
    }

    let abortHandler: (() => void) | undefined;
    const abortPromise = new Promise<void>((_, reject) => {
      abortHandler = () => reject(this.createAbortError());
      signal.addEventListener('abort', abortHandler!, {once: true});
    });

    try {
      await Promise.race([promise, abortPromise]);
    } finally {
      if (abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
    }
  }

  private createAbortError(): Error {
    const error = new Error('Command aborted');
    error.name = 'AbortError';
    return error;
  }

  simulateKeyEvent(e: KeyboardEvent): void {
    this.hotkeys.processEvent(e);
  }

  getHistory(): string[] {
    return this.history.getAll();
  }

  getUsageCount(commandId: string): number {
    return this.history.getUsageCount(commandId);
  }

  getShortcut(commandId: string): string | undefined {
    const normalizedKeys = this.shortcutsRev.get(commandId);
    if (!normalizedKeys) {
      return undefined;
    }

    const entries = this.shortcuts.get(normalizedKeys);
    const activeShortcut = this.getWinningShortcut(entries);
    return activeShortcut?.commandId === commandId
      ? activeShortcut.keys
      : undefined;
  }

  private getWinningShortcut(
    entries?: RegisteredShortcut[]
  ): RegisteredShortcut | undefined {
    return entries?.reduce<RegisteredShortcut | undefined>(
      (winner, candidate) => {
        if (!winner) {
          return candidate;
        }
        if (candidate.priority !== winner.priority) {
          return candidate.priority > winner.priority ? candidate : winner;
        }
        return candidate.order > winner.order ? candidate : winner;
      },
      undefined
    );
  }
}
