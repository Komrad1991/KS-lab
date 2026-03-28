const STORAGE_KEY = 'tinijs.history.commands';
const COUNTS_STORAGE_KEY = 'tinijs.history.command-counts';

export class CommandHistoryStore {
  private items: string[] = [];
  private counts: Record<string, number> = {};

  constructor() {
    this.items = this.loadItems();
    this.counts = this.loadCounts();
  }

  private loadItems(): string[] {
    try {
      if (typeof localStorage === 'undefined' || localStorage === null)
        return [];
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private loadCounts(): Record<string, number> {
    try {
      if (typeof localStorage === 'undefined' || localStorage === null)
        return {};
      const raw = localStorage.getItem(COUNTS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }
      const counts: Record<string, number> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (!!key && typeof value === 'number' && value > 0) {
          counts[key] = value;
        }
      });
      return counts;
    } catch {
      return {};
    }
  }

  private save(): void {
    try {
      if (typeof localStorage === 'undefined' || localStorage === null) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(this.counts));
    } catch {
      // ignore write errors in non-browser envs
    }
  }

  add(commandId: string): void {
    // move to front, keep unique, limit history length
    this.items = [commandId, ...this.items.filter(id => id !== commandId)];
    this.items = this.items.slice(0, 50);
    this.counts[commandId] = (this.counts[commandId] ?? 0) + 1;
    this.save();
  }

  getAll(): string[] {
    return this.items.slice();
  }

  getUsageCount(commandId: string): number {
    return this.counts[commandId] ?? 0;
  }

  clear(): void {
    this.items = [];
    this.counts = {};
    this.save();
  }
}

export default CommandHistoryStore;
