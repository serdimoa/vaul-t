import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { findRoot } from './lit-registry';
import type { VaulRoot } from './vaul-root';
import { DrawerDirection } from './types';
import { isInput } from './prevent-scroll';

type PointerPosition = { x: number; y: number };

/**
 * `<vaul-content>` is the drawer panel itself.
 *
 * It must have the CSS that positions it (e.g. `position: fixed; bottom: 0;`)
 * applied externally – Vaul ships `style.css` for the transition/animation
 * rules, but layout is left to the consumer.
 *
 * The element registers itself with the parent `<vaul-root>` and forwards
 * pointer events so the root can run the drag logic.
 */
@customElement('vaul-content')
export class VaulContent extends LitElement {
  @property({ type: Boolean, attribute: 'handle-only' }) handleOnly = false;

  private _root: VaulRoot | null = null;
  private _pointerStart: PointerPosition | null = null;
  private _lastKnownPointerEvent: PointerEvent | null = null;
  private _wasBeyondThePoint = false;
  private _cleanupViewport: (() => void) | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._root = findRoot(this) as VaulRoot | null;

    if (this._root) {
      this._root.registerContent(this);
      this.handleOnly = this._root.handleOnly;
      this._cleanupViewport = this._root.setupViewportListener();
    }

    this._attachListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupViewport?.();
    this._detachListeners();
  }

  private _attachListeners() {
    this.addEventListener('pointerdown', this._onPointerDown);
    this.addEventListener('pointermove', this._onPointerMove);
    this.addEventListener('pointerup', this._onPointerUp);
    this.addEventListener('pointerout', this._onPointerOut);
    this.addEventListener('contextmenu', this._onContextMenu);
    this.addEventListener('keydown', this._onKeyDown);
  }

  private _detachListeners() {
    this.removeEventListener('pointerdown', this._onPointerDown);
    this.removeEventListener('pointermove', this._onPointerMove);
    this.removeEventListener('pointerup', this._onPointerUp);
    this.removeEventListener('pointerout', this._onPointerOut);
    this.removeEventListener('contextmenu', this._onContextMenu);
    this.removeEventListener('keydown', this._onKeyDown);
  }

  private _isDeltaInDirection(
    delta: PointerPosition,
    direction: DrawerDirection,
    threshold = 0,
  ): boolean {
    if (this._wasBeyondThePoint) return true;

    const deltaY = Math.abs(delta.y);
    const deltaX = Math.abs(delta.x);
    const isDeltaX = deltaX > deltaY;
    const dFactor = ['bottom', 'right'].includes(direction) ? 1 : -1;

    if (direction === 'left' || direction === 'right') {
      const isReverseDirection = delta.x * dFactor < 0;
      if (!isReverseDirection && deltaX >= 0 && deltaX <= threshold) return isDeltaX;
    } else {
      const isReverseDirection = delta.y * dFactor < 0;
      if (!isReverseDirection && deltaY >= 0 && deltaY <= threshold) return !isDeltaX;
    }

    this._wasBeyondThePoint = true;
    return true;
  }

  private _onPointerDown = (e: PointerEvent) => {
    const root = this._root;
    if (!root) return;
    if (this.handleOnly) return;
    this._pointerStart = { x: e.pageX, y: e.pageY };
    root.onPress(e);
  };

  private _onPointerMove = (e: PointerEvent) => {
    const root = this._root;
    if (!root) return;
    this._lastKnownPointerEvent = e;
    if (this.handleOnly) return;
    if (!this._pointerStart) return;

    const yPosition = e.pageY - this._pointerStart.y;
    const xPosition = e.pageX - this._pointerStart.x;
    const swipeStartThreshold = e.pointerType === 'touch' ? 10 : 2;
    const delta = { x: xPosition, y: yPosition };

    const isAllowedToSwipe = this._isDeltaInDirection(delta, root.direction, swipeStartThreshold);
    if (isAllowedToSwipe) {
      root.onDrag(e);
    } else if (
      Math.abs(xPosition) > swipeStartThreshold ||
      Math.abs(yPosition) > swipeStartThreshold
    ) {
      this._pointerStart = null;
    }
  };

  private _onPointerUp = (e: PointerEvent) => {
    this._pointerStart = null;
    this._wasBeyondThePoint = false;
    this._root?.onRelease(e);
  };

  private _onPointerOut = (_e: PointerEvent) => {
    if (this._lastKnownPointerEvent) {
      this._root?.onRelease(this._lastKnownPointerEvent);
    }
  };

  private _onContextMenu = (_e: Event) => {
    if (this._lastKnownPointerEvent) {
      this._root?.onRelease(this._lastKnownPointerEvent);
    }
  };

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const root = this._root;
      if (root && root.dismissible) {
        root.closeDrawer();
      }
    }
  };

  // Focus trap helpers
  private _getFocusableElements(): HTMLElement[] {
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(this.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('disabled'),
    );
  }

  focusFirst() {
    const focusable = this._getFocusableElements();
    if (focusable.length > 0) {
      focusable[0]!.focus();
    } else {
      this.focus();
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-content': VaulContent;
  }
}
