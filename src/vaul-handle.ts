import { ReactiveElement } from 'lit';
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
 *
 * Uses plain real DOM – no shadow DOM, no slots.
 */
@customElement('vaul-handle')
export class VaulHandle extends ReactiveElement {
  /** When true, tapping the handle does not cycle through snap points. */
  @property({ attribute: 'prevent-cycle', type: Boolean }) preventCycle = false;

  private _root: VaulRoot | null = null;
  private _closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _shouldCancelInteraction = false;
  /** The inner div that carries `data-vaul-handle`. */
  private _handleDiv: HTMLDivElement | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._root = findRoot(this) as VaulRoot | null;
    this._buildDOM();

    // Keep data-vaul-drawer-visible in sync with the open state.
    this.addEventListener('vaul-open-change', this._syncVisible as EventListener, true);
    const rootEl = this._root as unknown as EventTarget | null;
    rootEl?.addEventListener('vaul-open-change', this._syncVisible as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    const rootEl = this._root as unknown as EventTarget | null;
    rootEl?.removeEventListener('vaul-open-change', this._syncVisible as EventListener);
  }

  private _syncVisible = () => {
    if (!this._handleDiv) return;
    const isOpen = this._root?.isOpen ?? false;
    this._handleDiv.setAttribute('data-vaul-drawer-visible', isOpen ? 'true' : 'false');
  };

  private _buildDOM() {
    // Move existing children into the hitarea span so user-defined content is preserved.
    const existingChildren = Array.from(this.childNodes);

    const div = document.createElement('div');
    div.setAttribute('data-vaul-handle', '');
    div.setAttribute('data-vaul-drawer-visible', (this._root?.isOpen ?? false) ? 'true' : 'false');
    div.setAttribute('aria-hidden', 'true');

    div.addEventListener('click', this._onHandleClick);
    div.addEventListener('pointercancel', this._onPointerCancel);
    div.addEventListener('pointerdown', this._onPointerDown);
    div.addEventListener('pointermove', this._onPointerMove);

    const span = document.createElement('span');
    span.setAttribute('data-vaul-handle-hitarea', '');
    span.setAttribute('aria-hidden', 'true');

    // Preserve any children the caller put inside <vaul-handle>.
    existingChildren.forEach((child) => span.appendChild(child));

    div.appendChild(span);
    this.appendChild(div);
    this._handleDiv = div;
  }

  // ─── Cycle snap points on tap ─────────────────────────────────────────────

  private _onHandleClick = () => this._handleStartCycle();
  private _onPointerCancel = () => this._handleCancelInteraction();

  private _onPointerDown = (e: PointerEvent) => {
    const r = this._root;
    if (r?.handleOnly) r.onPress(e);
    this._handleStartInteraction();
  };

  private _onPointerMove = (e: PointerEvent) => {
    const r = this._root;
    if (r?.handleOnly) r.onDrag(e);
  };

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

    const snapPoints = root.snapPoints;
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
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-handle': VaulHandle;
  }
}
