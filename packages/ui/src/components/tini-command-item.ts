import {css, html, nothing} from 'lit';
import {property} from 'lit/decorators.js';
import {TiniComponent} from '@tinijs/core';

import type {CommandDefinition} from '../types/command-definition.js';
import {ensurePalettePrimitivesRegistered} from './palette-primitives.js';

ensurePalettePrimitivesRegistered();

function highlightText(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return text;

  const index = text.toLowerCase().indexOf(normalizedQuery);
  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + normalizedQuery.length);
  const after = text.slice(index + normalizedQuery.length);

  return html`${before}<mark>${match}</mark>${after}`;
}

export class TiniCommandItem extends TiniComponent {
  static override styles = css`
    :host {
      display: block;
      border-radius: 18px;
      border: 1px solid transparent;
      background: transparent;
      transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease;
    }

    :host(:hover) {
      transform: translateY(-1px);
    }

    :host([selected]) {
      border-color: color-mix(in srgb, var(--cp-accent) 18%, transparent);
      background: var(--cp-item-selected);
    }

    .item {
      width: 100%;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      border-radius: inherit;
      cursor: pointer;
      background: transparent;
      color: inherit;
      border: none;
      text-align: left;
      font: inherit;
    }

    .item:hover {
      background: var(--cp-item-hover);
    }

    .icon {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: var(--cp-badge-bg);
      color: var(--cp-accent);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .content {
      min-width: 0;
      display: grid;
      gap: 4px;
    }

    .name {
      font-size: 15px;
      font-weight: 600;
      color: var(--cp-fg);
    }

    .desc {
      font-size: 13px;
      color: var(--cp-muted);
    }

    .meta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--cp-badge-bg);
      color: var(--cp-accent);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    tini-spinner {
      --color: var(--cp-accent);
      --size: 9px;
    }

    mark {
      background: color-mix(in srgb, var(--cp-accent) 18%, transparent);
      color: inherit;
      border-radius: 4px;
      padding: 0 2px;
    }
  `;

  @property({attribute: false})
  command?: CommandDefinition;

  @property({type: String})
  query = '';

  @property({type: String})
  shortcut = '';

  @property({type: Boolean, reflect: true})
  selected = false;

  @property({type: Boolean, reflect: true})
  loading = false;

  protected render() {
    if (!this.command) return nothing;

    const icon = this.command.icon?.trim() || this.command.name.slice(0, 2);

    return html`
      <button class="item" type="button">
        <span class="icon" aria-hidden="true">${icon}</span>
        <span class="content">
          <span class="name"
            >${highlightText(this.command.name, this.query)}</span
          >
          ${this.command.description
            ? html`
                <span class="desc">
                  ${highlightText(this.command.description, this.query)}
                </span>
              `
            : nothing}
        </span>
        <span class="meta">
          ${this.command.args?.length
            ? html`<span class="badge">Args</span>`
            : nothing}
          ${this.loading
            ? html`<tini-spinner aria-label="Loading"></tini-spinner>`
            : this.shortcut
              ? html`<tini-shortcut .keys=${this.shortcut}></tini-shortcut>`
              : nothing}
        </span>
      </button>
    `;
  }
}

customElements.define('tini-command-item', TiniCommandItem);

export default TiniCommandItem;
