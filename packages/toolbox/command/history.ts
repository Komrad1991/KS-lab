const STORAGE_KEY = 'tinijs.history.commands'

export class CommandHistoryStore {
  private items: string[] = []

  constructor() {
    this.items = this.load() ?? []
  }

  private load(): string[] | null {
    try {
      if (typeof localStorage === 'undefined' || localStorage === null) return []
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private save(): void {
    try {
      if (typeof localStorage === 'undefined' || localStorage === null) return
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    } catch {
      // ignore write errors in non-browser envs
    }
  }

  add(commandId: string): void {
    // move to front, keep unique, limit history length
    this.items = [commandId, ...this.items.filter((id) => id !== commandId)]
    this.items = this.items.slice(0, 50)
    this.save()
  }

  getAll(): string[] {
    return this.items.slice()
  }

  clear(): void {
    this.items = []
    this.save()
  }
}

export default CommandHistoryStore
