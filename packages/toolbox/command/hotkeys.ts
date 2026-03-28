import type {CommandService} from './command-service.js';

type ShortcutEntry = {
  keys: string;
  commandId: string;
  preventDefault: boolean;
  priority: number;
  order: number;
};

type SequenceEntry = {
  keys: string;
  sequence: string[];
  commandId: string;
  preventDefault: boolean;
  priority: number;
  order: number;
  idx: number;
  timeout?: ReturnType<typeof setTimeout>;
};

function normalizeSingleCombo(keys: string): string {
  return keys
    .split('+')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => (part.length === 1 ? part.toUpperCase() : part))
    .join('+')
    .toLowerCase();
}

function normalizeSequence(keys: string): string {
  return keys
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.toLowerCase())
    .join(' ');
}

export class HotkeyManager {
  private singleCombos = new Map<string, ShortcutEntry[]>();
  private sequences = new Map<string, SequenceEntry[]>();
  private service: CommandService;
  private readonly keyHandler: (e: KeyboardEvent) => void;
  private registrationOrder = 0;

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
    preventDefault = false,
    priority = 0
  ): void {
    const trimmed = keys.trim();
    if (trimmed.includes(' ')) {
      const normalizedSequence = normalizeSequence(trimmed);
      const sequence = normalizedSequence.split(' ');
      const entries = this.sequences.get(normalizedSequence) ?? [];
      const nextEntry: SequenceEntry = {
        keys: trimmed,
        sequence,
        commandId,
        preventDefault,
        priority,
        order: ++this.registrationOrder,
        idx: 0,
      };
      this.sequences.set(
        normalizedSequence,
        entries.filter(entry => entry.commandId !== commandId).concat(nextEntry)
      );
    } else {
      const normalized = normalizeSingleCombo(trimmed);
      const entries = this.singleCombos.get(normalized) ?? [];
      const nextEntry: ShortcutEntry = {
        keys: trimmed,
        commandId,
        preventDefault,
        priority,
        order: ++this.registrationOrder,
      };
      this.singleCombos.set(
        normalized,
        entries.filter(entry => entry.commandId !== commandId).concat(nextEntry)
      );
    }
  }

  unregisterShortcut(keys: string, commandId?: string): void {
    const low = keys.trim().includes(' ')
      ? normalizeSequence(keys)
      : normalizeSingleCombo(keys);
    if (!commandId) {
      this.singleCombos.delete(low);
      const removedSequences = this.sequences.get(low) ?? [];
      removedSequences.forEach(sequence => this.clearSequenceTimeout(sequence));
      this.sequences.delete(low);
      return;
    }
    const comboEntries = this.singleCombos.get(low);
    if (comboEntries?.length) {
      const filteredEntries = comboEntries.filter(
        entry => entry.commandId !== commandId
      );
      if (filteredEntries.length) {
        this.singleCombos.set(low, filteredEntries);
      } else {
        this.singleCombos.delete(low);
      }
    }

    const sequenceEntries = this.sequences.get(low);
    if (!sequenceEntries?.length) {
      return;
    }

    const filteredSequences = sequenceEntries.filter(sequence => {
      const shouldKeep = sequence.commandId !== commandId;
      if (!shouldKeep) {
        this.clearSequenceTimeout(sequence);
      }
      return shouldKeep;
    });

    if (filteredSequences.length) {
      this.sequences.set(low, filteredSequences);
    } else {
      this.sequences.delete(low);
    }
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
    const singleComboEntry = this.getWinningEntry(this.singleCombos.get(combo));
    if (singleComboEntry) {
      const {commandId, preventDefault} = singleComboEntry;
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
    const completedEntries: SequenceEntry[] = [];
    let advancedSequence = false;
    for (const entries of this.sequences.values()) {
      const sequenceEntry = this.getWinningEntry(entries);
      if (!sequenceEntry || !sequenceEntry.sequence.length) continue;

      const nextIndex = sequenceEntry.idx;
      if (sequenceEntry.sequence[nextIndex] !== pressed) {
        continue;
      }

      sequenceEntry.idx = nextIndex + 1;
      advancedSequence = true;

      if (sequenceEntry.idx >= sequenceEntry.sequence.length) {
        completedEntries.push(sequenceEntry);
        continue;
      }

      this.ensureSequenceTimeout(sequenceEntry);
    }

    if (completedEntries.length) {
      const winningSequence = this.getWinningEntry(completedEntries);
      if (winningSequence?.preventDefault) e.preventDefault();
      if (winningSequence) {
        this.service.runCommand(winningSequence.commandId);
        this.resetSequences();
        return;
      }
    }

    if (advancedSequence) {
      return;
    }

    this.resetSequences();
  }

  private resetSequences(): void {
    for (const entries of this.sequences.values()) {
      for (const sequence of entries) {
        sequence.idx = 0;
        this.clearSequenceTimeout(sequence);
      }
    }
  }

  private getWinningEntry<T extends ShortcutEntry>(
    entries?: T[]
  ): T | undefined {
    return entries?.reduce<T | undefined>((winner, candidate) => {
      if (!winner) {
        return candidate;
      }
      if (candidate.priority !== winner.priority) {
        return candidate.priority > winner.priority ? candidate : winner;
      }
      return candidate.order > winner.order ? candidate : winner;
    }, undefined);
  }

  private ensureSequenceTimeout(sequence: SequenceEntry): void {
    this.clearSequenceTimeout(sequence);
    sequence.timeout = setTimeout(() => this.resetSequences(), 800);
  }

  private clearSequenceTimeout(sequence: SequenceEntry): void {
    if (!sequence.timeout) {
      return;
    }
    clearTimeout(sequence.timeout);
    sequence.timeout = undefined;
  }
}
