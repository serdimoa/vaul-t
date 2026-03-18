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
  private _cleanupViewport: (() => void) | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._root = findRoot(this) as VaulRoot | null;
    if (this._root) {
      this._root.registerOverlay(this);
    }

    // Handle pointer-up for drag release
    this.addEventListener('pointerup', this._onPointerUp);
    this.addEventListener('mouseup', this._onMouseUp as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointerup', this._onPointerUp);
    this.removeEventListener('mouseup', this._onMouseUp as EventListener);
    this._cleanupViewport?.();
  }

  private _onPointerUp = (e: PointerEvent) => {
    if (this._root) {
      this._root.onRelease(e);
    }
  };

  private _onMouseUp = (e: MouseEvent) => {
    if (this._root) {
      // synthesise as pointer event for onRelease signature
      this._root.onRelease(e as unknown as PointerEvent);
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
