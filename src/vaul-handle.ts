import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { findRoot } from './lit-registry';
import type { VaulRoot } from './vaul-root';

const LONG_HANDLE_PRESS_TIMEOUT = 250;
const DOUBLE_TAP_TIMEOUT = 120;

/**
 * `<vaul-handle>` renders the visual drag handle bar and manages the
 * snap-point cycle behaviour on tap/click.
 *
 * When `handleOnly` is set on `<vaul-root>` this element is the only
 * interaction surface that initiates drag.
 */
@customElement('vaul-handle')
export class VaulHandle extends LitElement {
  /** When true, tapping the handle does not cycle through snap points. */
  @property({ attribute: 'prevent-cycle', type: Boolean }) preventCycle = false;

  private _root: VaulRoot | null = null;
  private _closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _shouldCancelInteraction = false;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._root = findRoot(this) as VaulRoot | null;
  }

  private _handleStartCycle() {
    if (this._shouldCancelInteraction) {
      this._handleCancelInteraction();
      return;
    }
    window.setTimeout(() => this._handleCycleSnapPoints(), DOUBLE_TAP_TIMEOUT);
  }

  private _handleCycleSnapPoints() {
    const root = this._root;
    if (!root) return;

    if (root.isDragging || this.preventCycle || this._shouldCancelInteraction) {
      this._handleCancelInteraction();
      return;
    }
    this._handleCancelInteraction();

    const snapPoints = root._snapPoints;
    if (!snapPoints || snapPoints.length === 0) {
      if (!root.dismissible) root.closeDrawer();
      return;
    }

    const activeSnapPoint = root.activeSnapPoint;
    const isLastSnapPoint = activeSnapPoint === snapPoints[snapPoints.length - 1];

    if (isLastSnapPoint && root.dismissible) {
      root.closeDrawer();
      return;
    }

    const currentIndex = snapPoints.findIndex((p) => p === activeSnapPoint);
    if (currentIndex === -1) return;
    const nextSnapPoint = snapPoints[currentIndex + 1];
    if (nextSnapPoint !== undefined) {
      root.setActiveSnapPoint(nextSnapPoint);
    }
  }

  private _handleStartInteraction() {
    this._closeTimeoutId = setTimeout(() => {
      this._shouldCancelInteraction = true;
    }, LONG_HANDLE_PRESS_TIMEOUT);
  }

  private _handleCancelInteraction() {
    if (this._closeTimeoutId) clearTimeout(this._closeTimeoutId);
    this._shouldCancelInteraction = false;
  }

  render() {
    const root = this._root;
    const isOpen = root?.isOpen ?? false;

    return html`
      <div
        data-vaul-handle=""
        data-vaul-drawer-visible=${isOpen ? 'true' : 'false'}
        aria-hidden="true"
        @click=${this._handleStartCycle}
        @pointercancel=${this._handleCancelInteraction}
        @pointerdown=${(e: PointerEvent) => {
          const r = this._root;
          if (r?.handleOnly) r.onPress(e);
          this._handleStartInteraction();
        }}
        @pointermove=${(e: PointerEvent) => {
          const r = this._root;
          if (r?.handleOnly) r.onDrag(e);
        }}
      >
        <span data-vaul-handle-hitarea="" aria-hidden="true"><slot></slot></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-handle': VaulHandle;
  }
}
