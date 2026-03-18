import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { findRoot } from './lit-registry';
import type { VaulRoot } from './vaul-root';

/**
 * `<vaul-trigger>` opens the drawer when clicked.
 *
 * Wrap any element (button, div, etc.) with this tag:
 * ```html
 * <vaul-trigger><button>Open</button></vaul-trigger>
 * ```
 */
@customElement('vaul-trigger')
export class VaulTrigger extends LitElement {
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
    this._root?.openDrawer();
  };

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-trigger': VaulTrigger;
  }
}
