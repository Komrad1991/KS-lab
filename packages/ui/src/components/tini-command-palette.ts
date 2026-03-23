import { CommandService } from '@tinijs/toolbox'
import { TiniComponent } from '@tinijs/core'
import type { CommandDefinition } from '@tinijs/toolbox'

export class TiniCommandPalette extends TiniComponent {
  private shadow: ShadowRoot | null = null
  private opened = false
  private service?: CommandService
  private inputEl?: HTMLInputElement
  private listEl?: HTMLElement
  private selectedIndex = 0
  private items: CommandDefinition[] = []

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadow = this.shadowRoot
    this.render()
    // global hotkey to open palette
    window.addEventListener('keydown', this.onGlobalKey.bind(this))
  }

  connectedCallback(): void {
    // nothing additional for now
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.onGlobalKey.bind(this))
  }

  set commandService(s: CommandService) {
    this.service = s
    this.refreshList()
  }

  private render(): void {
    if (!this.shadow) return
    this.shadow.innerHTML = `
      <style>
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; }
        .overlay[open] { display: flex; }
        .panel { background: white; width: min(720px, 92vw); border-radius: 12px; padding: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.25); }
        .search { width: 100%; padding: 8px 12px; margin-bottom: 8px; font-size: 14px; }
        .list { list-style: none; padding: 0; margin: 0; max-height: 50vh; overflow: auto; }
        .item { display: flex; align-items: center; padding: 8px 10px; cursor: pointer; border-radius: 6px; }
        .item[aria-selected="true"] { background: #eef2ff; }
        .name { font-weight: 500; margin-right: 8px; }
        .desc { color: #555; font-size: 12px; }
        .shortcut { margin-left: auto; opacity: .7; font-family: monospace; font-size: 12px; }
      </style>
      <div class="overlay" id="overlay" aria-hidden="true">
        <div class="panel">
          <input class="search" id="search" placeholder="Поиск..." autocomplete="off" />
          <ul class="list" id="list"></ul>
        </div>
      </div>
    `
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
      this.close()
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
        this.service.runCommand(cmd.id)
        this.close()
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
      // focus input after render
      requestAnimationFrame(() => this.inputEl?.focus())
      this.refreshList()
    }
  }

  private close(): void {
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
    const cmds = this.service?.searchCommands(q, this.currentContext) ?? []
    this.items = cmds
    this.selectedIndex = 0
    this.renderList()
  }

  private renderList(): void {
    if (!this.shadow) return
    const listRoot = this.shadow.getElementById('list') as HTMLElement
    if (!listRoot) return
    listRoot.innerHTML = ''
    this.items.forEach((c, idx) => {
      const li = document.createElement('li')
      li.className = 'item'
      li.setAttribute('role', 'option')
      li.setAttribute('aria-selected', idx === this.selectedIndex ? 'true' : 'false')
      li.innerHTML = `<span class="name">${c.name}</span><span class="desc">${c.description ?? ''}</span>`
      const sc = document.createElement('span')
      sc.className = 'shortcut'
      sc.textContent = ''
      li.appendChild(sc)
      li.addEventListener('click', () => {
        this.service?.runCommand(c.id)
        this.close()
      })
      listRoot.appendChild(li)
    })
  }

  // optional search input handler (not wired to events here yet)
  private onSearchInput = () => {
    this.refreshList()
  }
}

customElements.define('tini-command-palette', TiniCommandPalette)
