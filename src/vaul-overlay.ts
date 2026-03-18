import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { findRoot } from './lit-registry';
import type { VaulRoot } from './vaul-root';

/**
 * `<vaul-overlay>` renders the backdrop behind the drawer.
 *
 * Place it inside `<vaul-portal>` (or directly in `<vaul-root>` if you are
 * not using a portal).  It automatically picks up `data-vaul-*` attributes
 * from the root controller.
 */
@customElement('vaul-overlay')
export class VaulOverlay extends LitElement {
  private _root: VaulRoot | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._root = findRoot(this) as VaulRoot | null;
    if (this._root) {
      this._root.registerOverlay(this);
    }

    this.addEventListener('pointerup', this._onPointerUp);
    this.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointerup', this._onPointerUp);
    this.removeEventListener('click', this._onClick);
  }

  private _onPointerUp = (e: PointerEvent) => {
    if (this._root) {
      this._root.onRelease(e);
    }
  };

  /** Clicking the overlay (without dragging) dismisses the drawer. */
  private _onClick = (_e: MouseEvent) => {
    const root = this._root;
    if (!root) return;
    if (root.dismissible && root.isOpen) {
      root.closeDrawer();
    }
  };

  render() {
    const root = this._root;
    if (root && !root.modal) {
      return html``;
    }
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-overlay': VaulOverlay;
  }
}
