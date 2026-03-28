import type {CommandDefinition} from './definition.js';
import {fuzzyScore} from './fuzzy.js';
import CommandHistoryStore from './history.js';
import {HotkeyManager} from './hotkeys.js';

export class CommandService {
  private commands: Map<string, CommandDefinition> = new Map();
  private shortcuts: Map<string, string> = new Map(); // keys -> commandId
  private shortcutsRev: Map<string, string> = new Map(); // commandId -> keys
  private contextSubscribers: Array<(ctx: any) => void> = [];
  private currentContext: any = null;
  private history: CommandHistoryStore;
  private hotkeys: HotkeyManager;

  constructor() {
    this.history = new CommandHistoryStore();
    this.hotkeys = new HotkeyManager(this);
  }

  registerCommand(
    id: string,
    name: string,
    description?: string,
    icon?: string,
    action?: (
      args?: Record<string, any>,
      abortSignal?: AbortSignal
    ) => Promise<void> | void,
    keywords?: string[],
    category?: string,
    shouldShow?: (context: any) => boolean,
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
    for (const [k, v] of Array.from(this.shortcuts.entries())) {
      if (v === id) {
        this.shortcuts.delete(k);
        this.hotkeys.unregisterShortcut(k, id);
      }
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

  searchCommands(query: string, context?: any): CommandDefinition[] {
    let list = this.getRegisteredCommands();
    if (context === null || context === undefined)
      context = this.currentContext;
    list = list.filter(cmd => {
      if (typeof (cmd as any).shouldShow === 'function') {
        try {
          const res = (cmd as any).shouldShow(context);
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
    preventDefault = false
  ): void {
    const prevKeys = this.shortcutsRev.get(commandId);
    if (prevKeys) {
      this.shortcuts.delete(prevKeys);
      this.hotkeys.unregisterShortcut(prevKeys, commandId);
    }

    const previousCommandId = this.shortcuts.get(keys);
    if (previousCommandId) {
      this.shortcutsRev.delete(previousCommandId);
      this.hotkeys.unregisterShortcut(keys, previousCommandId);
    }

    this.shortcuts.set(keys, commandId);
    this.shortcutsRev.set(commandId, keys);
    this.hotkeys.registerShortcut(keys, commandId, preventDefault);
  }

  unregisterShortcut(keys: string, commandId?: string): void {
    if (!commandId) {
      const mappedCommandId = this.shortcuts.get(keys);
      this.shortcuts.delete(keys);
      if (mappedCommandId) this.shortcutsRev.delete(mappedCommandId);
      this.hotkeys.unregisterShortcut(keys);
      return;
    }
    const mapped = this.shortcuts.get(keys);
    if (mapped === commandId) {
      this.shortcuts.delete(keys);
      this.shortcutsRev.delete(commandId);
      this.hotkeys.unregisterShortcut(keys, commandId);
    }
  }

  subscribeContext(cb: (ctx: any) => void): void {
    this.contextSubscribers.push(cb);
  }

  getContext(): any {
    return this.currentContext;
  }

  updateContext(ctx: any): void {
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
    args?: Record<string, any>,
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
    return this.shortcutsRev.get(commandId);
  }
}
