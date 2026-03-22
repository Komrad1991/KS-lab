import type { CommandDefinition, ShortcutDefinition } from './definition'
import { fuzzyFilter } from './fuzzy'

export class CommandService {
  private commands: Map<string, CommandDefinition> = new Map()
  private shortcuts: Map<string, string> = new Map() // keys -> commandId
  private contextSubscribers: Array<(ctx: any) => void> = []
  private currentContext: any = null

  // Commands API
  registerCommand(
    id: string,
    name: string,
    description?: string,
    icon?: string,
    action?: (args?: any) => Promise<void> | void,
    keywords?: string[]
  ): void {
    const cmd: CommandDefinition = {
      id,
      name,
      description,
      icon,
      action: action ?? (() => Promise.resolve()),
      keywords,
      category: undefined
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

  // Basic search support (optional context)
  searchCommands(query: string, context?: any): CommandDefinition[] {
    let list = this.getRegisteredCommands()
    if (context && typeof (this as any).shouldShowContext === 'function') {
      // if there is a global context filter, apply it per command
      list = list.filter((cmd) => (cmd.shouldShow ? cmd.shouldShow(context) : true))
    }
    if (!query) return list
    return fuzzyFilter(query, list)
  }

  // Shortcuts API
  registerShortcut(keys: string, commandId: string, preventDefault = false): void {
    // Simple: map the keys string to commandId; later conflict resolution can be added
    this.shortcuts.set(keys, commandId)
  }

  unregisterShortcut(keys: string, commandId?: string): void {
    if (!commandId) {
      this.shortcuts.delete(keys)
      return
    }
    const mapped = this.shortcuts.get(keys)
    if (mapped === commandId) this.shortcuts.delete(keys)
  }

  // Context management (lightweight stub)
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
}
