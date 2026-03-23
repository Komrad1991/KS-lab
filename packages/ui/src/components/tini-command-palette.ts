import { CommandService } from '@tinijs/toolbox'
import { TiniComponent } from '@tinijs/core'
import type { CommandDefinition } from '@tinijs/toolbox'

export class TiniCommandPalette extends TiniComponent {
  static override styles = `
    :host {
      --cp-bg: #fff;
      --cp-fg: #222;
      --cp-item-bg: transparent;
      --cp-item-hover: #eef2ff;
      --cp-item-selected: #eef2ff;
      --cp-shortcut-bg: #f5f5f5;
      --cp-shortcut-fg: #555;
      --cp-border: #e0e0e0;
      --cp-shadow: 0 8px 32px rgba(0,0,0,.25);
    }
    [theme="dark"] {
      --cp-bg: #1e1e1e;
      --cp-fg: #e0e0e0;
      --cp-item-bg: transparent;
      --cp-item-hover: #2a2a2a;
      --cp-item-selected: #2a3a4a;
      --cp-shortcut-bg: #333;
      --cp-shortcut-fg: #bbb;
      --cp-border: #444;
      --cp-shadow: 0 8px 32px rgba(0,0,0,.6);
    }
  `
  private shadow: ShadowRoot | null = null
  private opened = false
  private service?: CommandService
  private inputEl?: HTMLInputElement
  private listEl?: HTMLElement
  private selectedIndex = 0
  private items: CommandDefinition[] = []
  private loadingCommands = new Set<string>()
  private abortControllers = new Map<string, AbortController>()
  private currentArgs?: Record<string, any>
  private selectedCommand?: CommandDefinition
  private theme: 'light' | 'dark' = 'light'

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadow = this.shadowRoot
    this.render()
    // global hotkey to open palette
    window.addEventListener('keydown', this.onGlobalKey.bind(this))
  }

  connectedCallback(): void {
    // bind overlay click to close
    const overlay = this.shadow?.getElementById('overlay')
    overlay?.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      if (target === overlay) this.close()
    })
    // bind search input
    const search = this.shadow?.getElementById('search') as HTMLInputElement | null
    search?.addEventListener('input', this.onSearchInput)
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.onGlobalKey.bind(this))
  }

  set commandService(s: CommandService) {
    this.service = s
    this.refreshList()
  }

  set theme(value: 'light' | 'dark') {
    this.theme = value
    this.updateThemeStyles()
  }

  private updateThemeStyles(): void {
    if (!this.shadow) return
    const root = this.shadow
    const isDark = this.theme === 'dark'
    const styles = isDark ? {
      '--cp-bg': '#1e1e1e',
      '--cp-fg': '#e0e0e0',
      '--cp-item-hover': '#2a2a2a',
      '--cp-item-selected': '#2a3a4a',
      '--cp-shortcut-bg': '#333',
      '--cp-shortcut-fg': '#bbb',
      '--cp-border': '#444',
      '--cp-shadow': '0 8px 32px rgba(0,0,0,.6)'
    } : {
      '--cp-bg': '#fff',
      '--cp-fg': '#222',
      '--cp-item-hover': '#eef2ff',
      '--cp-item-selected': '#eef2ff',
      '--cp-shortcut-bg': '#f5f5f5',
      '--cp-shortcut-fg': '#555',
      '--cp-border': '#e0e0e0',
      '--cp-shadow': '0 8px 32px rgba(0,0,0,.25)'
    }
    for (const [prop, val] of Object.entries(styles)) {
      root.style.setProperty(prop, val)
    }
  }

  private render(): void {
    if (!this.shadow) return
    this.shadow.innerHTML = `
      <style>
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; }
        .overlay[open] { display: flex; }
        .panel {
          background: var(--cp-bg, #fff);
          color: var(--cp-fg, #222);
          width: min(720px, 92vw);
          border-radius: 12px;
          padding: 12px;
          box-shadow: var(--cp-shadow, 0 8px 32px rgba(0,0,0,.25));
          border: 1px solid var(--cp-border, #e0e0e0);
        }
        .search { width: 100%; padding: 8px 12px; margin-bottom: 8px; font-size: 14px; background: transparent; color: inherit; border: 1px solid var(--cp-border, #e0e0e0); border-radius: 6px; }
        .list { list-style: none; padding: 0; margin: 0; max-height: 50vh; overflow: auto; }
        .item { display: flex; align-items: center; padding: 8px 10px; cursor: pointer; border-radius: 6px; background: var(--cp-item-bg, transparent); }
        .item[aria-selected="true"] { background: var(--cp-item-selected, #eef2ff); }
        .name { font-weight: 500; margin-right: 8px; }
        .desc { color: inherit; opacity: .7; font-size: 12px; }
        .shortcut { margin-left: auto; opacity: .7; font-family: monospace; font-size: 12px; display: flex; align-items: center; gap: 4px; color: var(--cp-shortcut-fg, #555); }
        .spinner { width: 14px; height: 14px; border: 2px solid #ccc; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite; margin-left: auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .args { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
        .args input, .args select { flex: 1; padding: 4px 8px; font-size: 12px; border: 1px solid var(--cp-border, #ccc); border-radius: 4px; background: transparent; color: inherit; min-width: 120px; }
        .cancel { color: #c00; cursor: pointer; margin-left: 8px; font-size: 12px; }
      </style>
      <div class="overlay" id="overlay" aria-hidden="true">
        <div class="panel">
          <input class="search" id="search" placeholder="Поиск..." autocomplete="off" />
          <ul class="list" id="list"></ul>
        </div>
      </div>
    `
    this.updateThemeStyles()
  }

  private onGlobalKey(e: KeyboardEvent): void {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    const mod = isMac ? e.metaKey : e.ctrlKey
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      this.open()
    }
    if (!this.opened) return
    if (e.key === 'Escape') {
      e.preventDefault()
      // If any command is loading, cancel it
      if (this.loadingCommands.size > 0) {
        for (const [cmdId, controller] of this.abortControllers) {
          controller.abort()
        }
        this.abortControllers.clear()
        this.loadingCommands.clear()
      } else {
        this.close()
      }
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const delta = e.key === 'ArrowDown' ? 1 : -1
      this.selectedIndex = Math.max(0, Math.min(this.items.length - 1, this.selectedIndex + delta))
      this.renderList()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = this.items[this.selectedIndex]
      if (cmd && this.service) {
        this.executeCommand(cmd)
      }
    }
  }

  private open(): void {
    if (!this.shadow) return
    const overlay = this.shadow.getElementById('overlay') as HTMLElement
    if (overlay) {
      overlay.setAttribute('open', 'true')
      overlay.setAttribute('aria-hidden', 'false')
      this.opened = true
      // reset selection and args on open
      this.clearSelection()
      // update theme styles
      this.updateThemeStyles()
      // focus input after render
      requestAnimationFrame(() => this.inputEl?.focus())
      this.refreshList()
    }
  }

  private close(): void {
    // cancel any running commands
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
    this.loadingCommands.clear()
    this.clearSelection()
    if (!this.shadow) return
    const overlay = this.shadow.getElementById('overlay') as HTMLElement
    if (overlay) {
      overlay.removeAttribute('open')
      overlay.setAttribute('aria-hidden', 'true')
      this.opened = false
    }
  }

  private refreshList(): void {
    if (!this.shadow) return
    const search = this.shadow.getElementById('search') as HTMLInputElement | null
    this.inputEl = search ?? this.inputEl
    const q = search?.value ?? ''
    const ctx = this.service?.getContext()
    this.items = this.service?.searchCommands(q, ctx) ?? []
    this.selectedIndex = 0
    this.renderList()
  }

  private renderList(): void {
    if (!this.shadow) return
    const listRoot = this.shadow.getElementById('list') as HTMLElement
    if (!listRoot) return
    listRoot.innerHTML = ''
    this.items.forEach((cmd, idx) => {
      const li = document.createElement('li')
      li.className = 'item'
      li.setAttribute('role', 'option')
      li.setAttribute('aria-selected', idx === this.selectedIndex ? 'true' : 'false')
      // name + description
      const nameSpan = document.createElement('span')
      nameSpan.className = 'name'
      nameSpan.textContent = cmd.name
      li.appendChild(nameSpan)
      if (cmd.description) {
        const descSpan = document.createElement('span')
        descSpan.className = 'desc'
        descSpan.textContent = cmd.description
        li.appendChild(descSpan)
      }
      // shortcut or spinner
      const shortcutSpan = document.createElement('span')
      shortcutSpan.className = 'shortcut'
      if (this.loadingCommands.has(cmd.id)) {
        const spinner = document.createElement('div')
        spinner.className = 'spinner'
        shortcutSpan.appendChild(spinner)
      } else {
        const keys = this.service?.getShortcut(cmd.id)
        if (keys) {
          const text = this.formatShortcut(keys)
          shortcutSpan.textContent = text
        }
      }
      li.appendChild(shortcutSpan)
      // args form if selected and has args
      if (this.selectedCommand?.id === cmd.id && cmd.args && cmd.args.length) {
        const argsDiv = document.createElement('div')
        argsDiv.className = 'args'
        const inputs: Record<string, any> = {}
        cmd.args.forEach(arg => {
          const wrapper = document.createElement('div')
          wrapper.style.display = 'flex'
          wrapper.style.gap = '4px'
          wrapper.style.marginTop = '4px'
          const label = document.createElement('label')
          label.textContent = arg.name + (arg.description ? ` (${arg.description})` : '')
          label.style.fontSize = '12px'
          const field = arg.type === 'select' && arg.options
            ? (() => {
                const sel = document.createElement('select')
                arg.options?.forEach(opt => {
                  const optEl = document.createElement('option')
                  optEl.value = opt
                  optEl.textContent = opt
                  sel.appendChild(optEl)
                })
                sel.addEventListener('change', () => {
                  inputs[arg.name] = sel.value
                })
                return sel
              })()
            : (() => {
                const inp = document.createElement('input')
                inp.type = arg.type === 'number' ? 'number' : 'text'
                inp.addEventListener('input', () => {
                  inputs[arg.name] = inp.value
                })
                return inp
              })()
          wrapper.appendChild(label)
          wrapper.appendChild(field)
          argsDiv.appendChild(wrapper)
        })
        // submit button
        const submit = document.createElement('button')
        submit.textContent = 'Запустить'
        submit.style.fontSize = '12px'
        submit.style.padding = '4px 8px'
        submit.addEventListener('click', async (e) => {
          e.stopPropagation()
          await this.executeCommandWithArgs(cmd, inputs)
        })
        argsDiv.appendChild(submit)
        // cancel
        const cancel = document.createElement('span')
        cancel.className = 'cancel'
        cancel.textContent = 'Отмена'
        cancel.addEventListener('click', (e) => {
          e.stopPropagation()
          this.clearSelection()
          this.refreshList()
        })
        argsDiv.appendChild(cancel)
        li.appendChild(argsDiv)
      }
      li.addEventListener('click', async (e) => {
        // Если уже загружается, игнорируем
        if (this.loadingCommands.has(cmd.id)) return
        // Если есть args, показываем форму, иначе выполняем
        if (cmd.args && cmd.args.length) {
          e.preventDefault()
          this.selectedCommand = cmd
          this.currentArgs = {}
          this.renderList()
          // После рендера установить фокус на первое поле?
          setTimeout(() => {
            const firstInput = li.querySelector('input, select') as HTMLElement
            firstInput?.focus()
          }, 0)
        } else {
          await this.executeCommand(cmd)
        }
      })
      listRoot.appendChild(li)
    })
  }

  private formatShortcut(keys: string): string {
    // Simple: convert ctrl to ⌃, meta to ⌘, etc.
    return keys
      .replace(/ctrl/gi, 'Ctrl')
      .replace(/meta/gi, '⌘')
      .replace(/alt/gi, 'Alt')
      .replace(/shift/gi, 'Shift')
  }

  private async executeCommand(cmd: CommandDefinition): Promise<void> {
    if (!this.service) return
    const controller = new AbortController()
    this.abortControllers.set(cmd.id, controller)
    this.setLoading(cmd.id, true)
    try {
      await this.service.runCommand(cmd.id, undefined, controller.signal)
      this.close()
    } finally {
      this.setLoading(cmd.id, false)
    }
  }
  }

  private async executeCommandWithArgs(cmd: CommandDefinition, args: Record<string, any>): Promise<void> {
    if (!this.service) return
    const controller = new AbortController()
    this.abortControllers.set(cmd.id, controller)
    this.setLoading(cmd.id, true)
    try {
      await this.service.runCommand(cmd.id, args, controller.signal)
      this.close()
    } finally {
      this.setLoading(cmd.id, false)
    }
  }

  private setLoading(commandId: string, loading: boolean): void {
    if (loading) {
      this.loadingCommands.add(commandId)
    } else {
      this.loadingCommands.delete(commandId)
      this.abortControllers.delete(commandId)
    }
    this.renderList()
  }

  private clearSelection(): void {
    this.selectedCommand = null
    this.currentArgs = {}
  }
      // shortcut or spinner
      const shortcutSpan = document.createElement('span')
      shortcutSpan.className = 'shortcut'
      if (this.loadingCommands.has(c.id)) {
        const spinner = document.createElement('div')
        spinner.className = 'spinner'
        shortcutSpan.appendChild(spinner)
      } else {
        const keys = this.service?.getShortcut(c.id)
        if (keys) {
          const text = this.formatShortcut(keys)
          shortcutSpan.textContent = text
        }
      }
      li.appendChild(shortcutSpan)
      // args form if selected and has args
      if (this.selectedCommand?.id === c.id && c.args && c.args.length) {
        const argsDiv = document.createElement('div')
        argsDiv.className = 'args'
        const inputs: Record<string, any> = {}
        c.args.forEach(arg => {
          const wrapper = document.createElement('div')
          wrapper.style.display = 'flex'
          wrapper.style.gap = '4px'
          const label = document.createElement('label')
          label.textContent = arg.name + (arg.description ? ` (${arg.description})` : '')
          label.style.fontSize = '12px'
          const field = arg.type === 'select' && arg.options
            ? (() => {
                const sel = document.createElement('select')
                arg.options?.forEach(opt => {
                  const optEl = document.createElement('option')
                  optEl.value = opt
                  optEl.textContent = opt
                  sel.appendChild(optEl)
                })
                sel.addEventListener('change', () => {
                  inputs[arg.name] = sel.value
                })
                return sel
              })()
            : (() => {
                const inp = document.createElement('input')
                inp.type = arg.type === 'number' ? 'number' : 'text'
                inp.addEventListener('input', () => {
                  inputs[arg.name] = inp.value
                })
                return inp
              })()
          wrapper.appendChild(label)
          wrapper.appendChild(field)
          argsDiv.appendChild(wrapper)
        })
        // submit button
        const submit = document.createElement('button')
        submit.textContent = 'Запустить'
        submit.style.fontSize = '12px'
        submit.style.padding = '4px 8px'
        submit.addEventListener('click', async (e) => {
          e.stopPropagation()
          await this.executeCommandWithArgs(c, inputs)
        })
        argsDiv.appendChild(submit)
        // cancel
        const cancel = document.createElement('span')
        cancel.className = 'cancel'
        cancel.textContent = 'Отмена'
        cancel.addEventListener('click', (e) => {
          e.stopPropagation()
          this.clearSelection()
          this.refreshList()
        })
        argsDiv.appendChild(cancel)
        li.appendChild(argsDiv)
      }
      li.addEventListener('click', async (e) => {
        // Если уже загружается, игнорируем
        if (this.loadingCommands.has(c.id)) return
        // Если есть args, показываем форму, иначе выполняем
        if (c.args && c.args.length) {
          e.preventDefault()
          this.selectedCommand = c
          this.currentArgs = {}
          this.renderList()
        } else {
          this.executeCommand(c)
        }
      })
      listRoot.appendChild(li)
    })
  }

  private formatShortcut(keys: string): string {
    // Simple: convert ctrl to ⌃, meta to ⌘, etc.
    return keys
      .replace(/ctrl/gi, 'Ctrl')
      .replace(/meta/gi, '⌘')
      .replace(/alt/gi, 'Alt')
      .replace(/shift/gi, 'Shift')
  }

  private async executeCommand(cmd: CommandDefinition): Promise<void> {
    if (!this.service) return
    this.setLoading(dmd.id, true)
    try {
      await this.service.runCommand(m.id)
      this.close()
    } finally {
      this.setLoading(md.id, false)
    }
  }

  private async executeCommandWithArgs(md: CommandDefinition, args: Record<string, any>): Promise<void> {
    if (!this.service) return
    this.setLoading(md.id, true)
    try {
      await this.service.runCommand(md.id, args)
      this.close()
    } finally {
      this.setLoading(md.id, false)
    }
  }

  private setLoading(commandId: string, loading: boolean): void {
    if (loading) {
      this.loadingCommands.add(commandId)
    } else {
      this.loadingCommands.delete(commandId)
      this.abortControllers.delete(commandId)
    }
    this.renderList()
  }

  private clearSelection(): void {
    this.selectedCommand = null
    this.currentArgs = {}
  }

  // optional search input handler (not wired to events here yet)
  private onSearchInput = () => {
    this.refreshList()
  }
}

customElements.define('tini-command-palette', TiniCommandPalette)
