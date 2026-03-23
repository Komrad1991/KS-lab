import type { CommandDefinition, ShortcutDefinition } from './definition'
import { fuzzyFilter, fuzzyScore } from './fuzzy'
import CommandHistoryStore from './history.js'
import { HotkeyManager } from './hotkeys'

export class CommandService {
  private commands: Map<string, CommandDefinition> = new Map()
   private shortcuts: Map<string, string> = new Map() // keys -> commandId
   private shortcutsRev: Map<string, string> = new Map() // commandId -> keys
  private contextSubscribers: Array<(ctx: any) => void> = []
  private currentContext: any = null
  private history: CommandHistoryStore
  private hotkeys: HotkeyManager

  constructor() {
    this.history = new CommandHistoryStore()
    this.hotkeys = new HotkeyManager(this)
  }

   // Commands API
   registerCommand(
     id: string,
     name: string,
     description?: string,
     icon?: string,
     action?: (args?: Record<string, any>, abortSignal?: AbortSignal) => Promise<void> | void,
     keywords?: string[],
     category?: string,
     shouldShow?: (context: any) => boolean,
     args?: CommandDefinition['args']
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
       args
     }
     this.commands.set(id, cmd)
   }

  unregisterCommand(id: string): void {
    this.commands.delete(id)
    // remove any shortcuts pointing to this command
    for (const [k, v] of Array.from(this.shortcuts.entries())) {
      if (v === id) this.shortcuts.delete(k)
    }
  }

   getRegisteredCommands(): CommandDefinition[] {
     return Array.from(this.commands.values())
   }

   getCommandsByCategory(): Map<string, CommandDefinition[]> {
     const map = new Map<string, CommandDefinition[]>()
     for (const cmd of this.commands.values()) {
       const cat = cmd.category ?? 'Uncategorized'
       const list = map.get(cat) ?? []
       list.push(cmd)
       map.set(cat, list)
     }
     return map
   }

  // Basic search support (optional context)
  searchCommands(query: string, context?: any): CommandDefinition[] {
    // start with all commands
    let list = this.getRegisteredCommands()
    // filter by shouldShow(context) if provided on command
    if (context == null) context = this.currentContext
    list = list.filter((cmd) => {
      if (typeof (cmd as any).shouldShow === 'function') {
        try {
          // Call with current or provided context
          const res = (cmd as any).shouldShow(context)
          return typeof res === 'boolean' ? res : true
        } catch {
          return false
        }
      }
      return true
    })
    if (!query) return list
    // rank by fuzzy score
    const scored = list.map((cmd) => {
      const text = `${cmd.name} ${cmd.description ?? ''} ${(cmd.keywords ?? []).join(' ')}`
      const score = fuzzyScore(query, text)
      return { cmd, score }
    }).filter((x) => x.score > 0)
      .sort((a, b) => {
        // boost by history recency if available
        const ah = (this.history?.getAll?.() ?? []).includes(a.cmd.id) ? 1000 : 0
        const bh = (this.history?.getAll?.() ?? []).includes(b.cmd.id) ? 1000 : 0
        if (b.score + bh !== a.score + ah) {
          return (b.score + bh) - (a.score + ah)
        }
        return 0
      })
    return scored.map((x) => x.cmd)
  }

  // Shortcuts API
   registerShortcut(keys: string, commandId: string, preventDefault = false): void {
     // Simple: map the keys string to commandId; later conflict resolution can be added
     this.shortcuts.set(keys, commandId)
     // maintain reverse mapping: commandId -> keys (last registered wins)
     this.shortcutsRev.set(commandId, keys)
   }

   unregisterShortcut(keys: string, commandId?: string): void {
     if (!commandId) {
       this.shortcuts.delete(keys)
       // also remove from reverse map for any commands that used these keys
       for (const [cid, k] of this.shortcutsRev.entries()) {
         if (k === keys) this.shortcutsRev.delete(cid)
       }
       return
     }
     const mapped = this.shortcuts.get(keys)
     if (mapped === commandId) {
       this.shortcuts.delete(keys)
       this.shortcutsRev.delete(commandId)
     }
   }

   // Context management
   subscribeContext(cb: (ctx: any) => void): void {
     this.contextSubscribers.push(cb)
   }

   getContext(): any {
     return this.currentContext
   }

   // Context update helper (used by app to push context)
   updateContext(ctx: any): void {
     this.currentContext = ctx
     for (const cb of this.contextSubscribers) cb(ctx)
   }

   // Get recent commands from history (for "Recent" section)
   getRecentCommands(limit = 10): CommandDefinition[] {
     const recentIds = this.history.getAll().slice(0, limit)
     return recentIds.map(id => this.commands.get(id)).filter(c => c !== undefined) as CommandDefinition[]
   }

   // Execute a registered command by id
   async runCommand(id: string, args?: Record<string, any>, abortSignal?: AbortSignal): Promise<void> {
     const cmd = this.commands.get(id)
     if (!cmd) throw new Error(`Command not found: ${id}`)
     const controller = new AbortController()
     const mergedSignal = abortSignal ? this.mergeSignals(abortSignal, controller.signal) : controller.signal
     const result = cmd.action?.(args, mergedSignal)
     // Await with abort support
     await this.awaitWithCancel(result, mergedSignal)
     // record in history after successful run
     try {
       this.history.add(id)
     } catch {
       // ignore history write errors
     }
   }

   private mergeSignals(s1: AbortSignal, s2: AbortSignal): AbortSignal {
     const controller = new AbortController()
     const abort = () => controller.abort()
     s1.addEventListener('abort', abort)
     s2.addEventListener('abort', abort)
     return controller.signal
   }

   private async awaitWithCancel(promise: any, signal: AbortSignal): Promise<void> {
     if (!(promise instanceof Promise)) return
     let completed = false
     try {
       const res = await promise
       completed = true
       return res
     } finally {
       if (!completed && signal.aborted) {
         // If aborted before completion, we could throw or just ignore
       }
     }
   }

  // Expose a way to simulate key events for tests (hotkeys)
  simulateKeyEvent(e: KeyboardEvent): void {
    // delegate to hotkeys processor if available
    // @ts-ignore
    this.hotkeys?.processEvent?.(e)
  }

   // Expose history (for tests/debugging)
   getHistory(): string[] {
     return this.history.getAll()
   }

   // Get shortcut keys assigned to a command
   getShortcut(commandId: string): string | undefined {
     return this.shortcutsRev.get(commandId)
   }
 }
