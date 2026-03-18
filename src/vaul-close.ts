import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { findRoot } from './lit-registry';
import type { VaulRoot } from './vaul-root';

/**
 * `<vaul-close>` closes the drawer when clicked.
 *
 * ```html
 * <vaul-close><button>Close</button></vaul-close>
 * ```
 */
@customElement('vaul-close')
export class VaulClose extends LitElement {
  private _root: VaulRoot | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._root = findRoot(this) as VaulRoot | null;
    this.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this._onClick);
  }

  private _onClick = (e: MouseEvent) => {
    e.stopPropagation();
    this._root?.closeDrawer();
  };

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-close': VaulClose;
  }
}
