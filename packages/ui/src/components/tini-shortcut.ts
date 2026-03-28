import {css, html, nothing} from 'lit';
import {property} from 'lit/decorators.js';
import {TiniComponent} from '@tinijs/core';
import {normalizeShortcutKey} from './shortcut-utils.js';

export class TiniShortcut extends TiniComponent {
  static override styles = css`
    :host {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .combo {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--cp-shortcut-bg) 86%, transparent);
      border: 1px solid
        color-mix(in srgb, var(--cp-shortcut-fg) 10%, transparent);
    }

    kbd {
      min-width: 24px;
      padding: 4px 8px;
      border-radius: 10px;
      background: var(--cp-shortcut-bg);
      color: var(--cp-shortcut-fg);
      border: 1px solid
        color-mix(in srgb, var(--cp-shortcut-fg) 14%, transparent);
      box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--cp-shortcut-fg) 18%, transparent);
      font:
        600 12px/1.2 ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        'Liberation Mono',
        'Courier New',
        monospace;
      text-align: center;
    }

    .plus {
      color: color-mix(in srgb, var(--cp-shortcut-fg) 62%, transparent);
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
    }

    .arrow {
      color: var(--cp-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
  `;

  @property({type: String, reflect: true})
  keys = '';

  protected render() {
    if (!this.keys.trim()) return nothing;

    const sequence = this.keys.split(/\s+/).filter(Boolean);
    return html`
      ${sequence.map((combo, index) => {
        const keys = combo
          .split('+')
          .map(key => normalizeShortcutKey(key))
          .filter(Boolean);
        return html`
          <span class="combo" aria-label=${keys.join(' plus ')}>
            ${keys.map(
              (key, keyIndex) => html`
                <kbd>${key}</kbd>${keyIndex < keys.length - 1
                  ? html`<span class="plus" aria-hidden="true">+</span>`
                  : nothing}
              `
            )}
          </span>
          ${index < sequence.length - 1
            ? html`<span class="arrow">then</span>`
            : nothing}
        `;
      })}
    `;
  }
}

customElements.define('tini-shortcut', TiniShortcut);
