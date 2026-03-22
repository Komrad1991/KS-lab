import { TiniComponent } from '@tinijs/core'

export class TiniCommandItem extends TiniComponent {
  constructor(public id: string, public label: string, public description?: string, public shortcut?: string) {
    super()
    this.render()
  }

  private render(): void {
    // Minimal skeleton render
    const el = document.createElement('div')
    el.textContent = `${this.label} ${this.shortcut ? '• ' + this.shortcut : ''}`
    // In a real implementation, this would be richer (icon, description, spinner for async)
    this.appendChild(el)
  }
}

customElements.define('tini-command-item', TiniCommandItem)

export default TiniCommandItem
