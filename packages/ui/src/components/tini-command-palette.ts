import { CommandService } from '@tinijs/toolbox'
import { TiniComponent } from '@tinijs/core'

export class TiniCommandPalette extends TiniComponent {
  private shadow: ShadowRoot | null = null
  private opened = false

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadow = this.shadowRoot
    this.render()
    // open on Cmd/Ctrl+K
    window.addEventListener('keydown', this.onKey.bind(this))
  }

  connectedCallback(): void {
    // mount placeholder
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.onKey.bind(this))
  }

  private render(): void {
    if (!this.shadow) return
    this.shadow.innerHTML = `
      <style>
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; }
        .overlay[open] { display: flex; }
        .panel { background: white; width: 60vw; max-width: 860px; min-height: 200px; border-radius: 8px; padding: 16px; }
        /* light style only for skeleton */
      </style>
      <div class="overlay" id="overlay" aria-hidden="true">
        <div class="panel">Command Palette</div>
      </div>
    `
  }

  private onKey(e: KeyboardEvent): void {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    const mod = isMac ? e.metaKey : e.ctrlKey
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      this.open()
    }
  }

  open(): void {
    if (!this.shadow) return
    const overlay = this.shadow.getElementById('overlay') as HTMLElement
    if (overlay) {
      overlay.setAttribute('open', 'true')
      overlay.setAttribute('aria-hidden', 'false')
      this.opened = true
    }
  }

  close(): void {
    if (!this.shadow) return
    const overlay = this.shadow.getElementById('overlay') as HTMLElement
    if (overlay) {
      overlay.removeAttribute('open')
      overlay.setAttribute('aria-hidden', 'true')
      this.opened = false
    }
  }
}

customElements.define('tini-command-palette', TiniCommandPalette)

export default TiniCommandPalette
