import type {CommandService} from './command-service.js';

type ShortcutEntry = {
  commandId: string;
  preventDefault?: boolean;
};

type SequenceEntry = {
  sequence: string[];
  commandId: string;
  preventDefault?: boolean;
  idx?: number;
  timeout?: any;
};

export class HotkeyManager {
  private singleCombos = new Map<string, ShortcutEntry>();
  private sequences: SequenceEntry[] = [];
  private service: CommandService;
  private readonly keyHandler: (e: KeyboardEvent) => void;

  constructor(service: CommandService) {
    this.service = service;
    this.keyHandler = this.handleKey.bind(this);
    this.initListener();
  }

  private initListener(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this.keyHandler);
  }

  registerShortcut(
    keys: string,
    commandId: string,
    preventDefault = false
  ): void {
    const trimmed = keys.trim();
    if (trimmed.includes(' ')) {
      // sequence, e.g., "g h"
      const seq = trimmed.split(/\s+/).map(s => s.toLowerCase());
      const normalizedSeq = seq.join(' ');
      // Remove any existing sequence with same normalized sequence (last-write-wins)
      this.sequences = this.sequences.filter(
        s => s.sequence.join(' ') !== normalizedSeq
      );
      this.sequences.push({sequence: seq, commandId, preventDefault, idx: 0});
    } else {
      // single combo like Ctrl+K or Meta+S
      const parts = trimmed.split('+').map(p => p.trim());
      const normalized = parts
        .map(p => (p.length === 1 ? p.toUpperCase() : p))
        .join('+')
        .toLowerCase();
      this.singleCombos.set(normalized, {commandId, preventDefault});
    }
  }

  unregisterShortcut(keys: string, commandId?: string): void {
    const low = keys.toLowerCase();
    if (!commandId) {
      this.singleCombos.delete(low);
      this.sequences = this.sequences.filter(s => s.sequence.join(' ') !== low);
      return;
    }
    const entry = this.singleCombos.get(low);
    if (entry && entry.commandId === commandId) this.singleCombos.delete(low);
    this.sequences = this.sequences.filter(
      s => !(s.commandId === commandId && s.sequence.join(' ') === low)
    );
  }

  // Public API to allow tests to simulate key events
  public processEvent(e: KeyboardEvent): void {
    this.handleKey(e);
  }

  private handleKey(e: KeyboardEvent): void {
    // Build a canonical representation of the pressed key combo
    const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    const mods: string[] = [];
    if (e.ctrlKey) mods.push('Ctrl');
    if (e.metaKey) mods.push('Meta');
    if (e.altKey) mods.push('Alt');
    if (e.shiftKey) mods.push('Shift');
    const combo = [...mods, keyName].join('+').toLowerCase();

    // Check single combos first
    if (this.singleCombos.has(combo)) {
      const {commandId, preventDefault} = this.singleCombos.get(combo)!;
      if (preventDefault) e.preventDefault();
      this.service.runCommand(commandId);
      this.resetSequences();
      return;
    }

    // Check sequences (simple two-or-more key sequences)
    const pressed = (e.key || '').toString().toLowerCase();
    if (!pressed) {
      return;
    }
    for (const s of this.sequences) {
      if (!s.sequence || s.sequence.length === 0) continue;
      // initialize index if not present
      const idx = (s as any)._idx ?? 0;
      if (s.sequence[idx] === pressed) {
        // advance index
        (s as any)._idx = idx + 1;
        // if finished, trigger
        if ((s as any)._idx >= s.sequence.length) {
          if (s.preventDefault) e.preventDefault();
          this.service.runCommand(s.commandId);
          this.resetSequences();
          return;
        } else {
          // set timeout to reset if next key isn't pressed quickly
          if ((s as any)._timeout === undefined) {
            (s as any)._timeout = setTimeout(() => this.resetSequences(), 800);
          }
          return;
        }
      }
    }
    // no match: reset all
    this.resetSequences();
  }

  private resetSequences(): void {
    for (const s of this.sequences) {
      (s as any)._idx = 0;
      if ((s as any)._timeout) {
        clearTimeout((s as any)._timeout);
        (s as any)._timeout = undefined;
      }
    }
  }
}
