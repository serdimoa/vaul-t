import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DrawerDirection } from './types';
import {
  set,
  reset,
  getTranslate,
  dampenValue,
  isVertical,
  assignStyle,
  chain,
} from './helpers';
import {
  TRANSITIONS,
  VELOCITY_THRESHOLD,
  CLOSE_THRESHOLD,
  SCROLL_LOCK_TIMEOUT,
  BORDER_RADIUS,
  NESTED_DISPLACEMENT,
  WINDOW_TOP_OFFSET,
  DRAG_CLASS,
} from './constants';
import { createSnapPoints } from './snap-points';
import { enablePreventScroll, isInput } from './prevent-scroll';
import { setPositionFixed, restorePositionFixed, trackScroll } from './position-fixed';
import { registerRoot, unregisterRoot } from './lit-registry';
import { isIOS, isMobileFirefox } from './browser';

let uidCounter = 0;

/**
 * `<vaul-root>` is the top-level controller element for a Vaul drawer.
 *
 * It manages all open/close state, drag interactions and snap-point logic.
 * The child elements (`<vaul-overlay>`, `<vaul-content>`, `<vaul-handle>`,
 * `<vaul-trigger>`, `<vaul-close>`, `<vaul-portal>`) communicate with this
 * element either by DOM traversal (for elements still in the tree) or via the
 * global registry (for portalled elements stamped with `data-vaul-root-id`).
 */
@customElement('vaul-root')
export class VaulRoot extends LitElement {
  // ─── Public attributes / properties ────────────────────────────────────────

  /** Whether the drawer is open (controlled mode). */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Open the drawer by default on first render (uncontrolled mode). */
  @property({ attribute: 'default-open', type: Boolean }) defaultOpen = false;

  /** Direction the drawer slides in from. */
  @property({ type: String }) direction: DrawerDirection = 'bottom';

  /** Fraction of the drawer height/width that must be dragged to close it. */
  @property({ attribute: 'close-threshold', type: Number }) closeThreshold = CLOSE_THRESHOLD;

  /** Duration (ms) after a scroll during which dragging is suppressed. */
  @property({ attribute: 'scroll-lock-timeout', type: Number }) scrollLockTimeout = SCROLL_LOCK_TIMEOUT;

  /** When true the drawer cannot be dismissed by dragging or clicking outside. */
  @property({ type: Boolean }) dismissible = true;

  /** When true only the `<vaul-handle>` can initiate a drag. */
  @property({ attribute: 'handle-only', type: Boolean }) handleOnly = false;

  /** Snap points as a JSON string, e.g. `'[0.5, 1]'` or `'["300px", "100%"]'`. */
  @property({ attribute: 'snap-points', type: String }) snapPointsAttr: string | null = null;

  /** Index of the snap point above which the overlay fades in. */
  @property({ attribute: 'fade-from-index', type: Number }) fadeFromIndex?: number;

  /** Actively selected snap point (controlled). */
  @property({ attribute: 'active-snap-point' }) activeSnapPointAttr: string | null = null;

  /** Whether to apply a background-scale effect to `[data-vaul-drawer-wrapper]`. */
  @property({ attribute: 'should-scale-background', type: Boolean }) shouldScaleBackground = false;

  /** Whether to tint the page background dark when scaling. */
  @property({ attribute: 'set-background-color-on-scale', type: Boolean }) setBackgroundColorOnScale = true;

  /** Prevent the drawer from applying any styles to `document.body`. */
  @property({ attribute: 'no-body-styles', type: Boolean }) noBodyStyles = false;

  /** When true the overlay / portal acts as a non-modal (background is interactive). */
  @property({ type: Boolean }) modal = true;

  /** Fix the drawer height so it only scrolls instead of moving up with the keyboard. */
  @property({ type: Boolean }) fixed = false;

  /** Disable velocity-based snap-point skipping. */
  @property({ attribute: 'snap-to-sequential-point', type: Boolean }) snapToSequentialPoint = false;

  /** Prevent browser scroll-restoration on navigation while the drawer is open. */
  @property({ attribute: 'prevent-scroll-restoration', type: Boolean }) preventScrollRestoration = false;

  /** Whether to reposition inputs when the soft keyboard opens. */
  @property({ attribute: 'reposition-inputs', type: Boolean }) repositionInputs = true;

  /** Whether to auto-focus the first focusable element when the drawer opens. */
  @property({ attribute: 'auto-focus', type: Boolean }) autoFocus = false;

  /** Custom container element to render the portal into. */
  @property({ attribute: false }) container: HTMLElement | null = null;

  // ─── Internal state ─────────────────────────────────────────────────────────

  @state() private _isOpen = false;
  @state() private _isDragging = false;
  @state() private _hasBeenOpened = false;
  @state() private _activeSnapPoint: number | string | null = null;
  @state() private _activeSnapPointIndex = 0;

  /** True when the caller has explicitly supplied the `open` prop (controlled mode). */
  private _isControlled = false;

  // ─── Unique ID (used by the global registry) ────────────────────────────────

  readonly uid = `vaul-${++uidCounter}`;

  // ─── Mutable refs (not reactive) ────────────────────────────────────────────

  private _pointerStart = 0;
  private _dragStartTime: Date | null = null;
  private _dragEndTime: Date | null = null;
  private _lastTimeDragPrevented: Date | null = null;
  private _isAllowedToDrag = false;
  private _keyboardIsOpen = false;
  private _shouldAnimate = true;
  private _openTime: Date | null = null;
  private _previousDiffFromInitial = 0;
  private _initialDrawerHeight = 0;
  private _nestedOpenChangeTimer: ReturnType<typeof setTimeout> | null = null;
  private _justReleased = false;
  private _drawerHeight = 0;
  private _drawerWidth = 0;
  private _restoreScroll: (() => void) | null = null;
  private _stopTrackingScroll: (() => void) | null = null;
  private _initialBackgroundColor = '';
  private _scaleBackgroundCleanup: (() => void) | null = null;

  // ─── References to sibling Lit elements ────────────────────────────────────

  private _drawerEl: HTMLElement | null = null;
  private _overlayEl: HTMLElement | null = null;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  connectedCallback() {
    super.connectedCallback();
    registerRoot(this);
    this._stopTrackingScroll = trackScroll();
    this._initialBackgroundColor = document.body.style.backgroundColor;

    // Detect controlled mode: if 'open' attribute is present in the HTML, assume controlled.
    this._isControlled = this.hasAttribute('open');

    // Uncontrolled default-open
    if (this.defaultOpen) {
      this._shouldAnimate = false;
      this._setOpen(true);
    }
    requestAnimationFrame(() => {
      this._shouldAnimate = true;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    unregisterRoot(this);
    this._stopTrackingScroll?.();
    if (this._nestedOpenChangeTimer) clearTimeout(this._nestedOpenChangeTimer);
    this._scaleBackgroundCleanup?.();
    this._restoreScroll?.();
  }

  /** LitElement uses light DOM so existing CSS selectors work unchanged. */
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`<slot></slot>`;
  }

  // ─── Property change handling ─────────────────────────────────────────────

  updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open !== this._isOpen) {
        this._setOpen(this.open);
      }
    }
    if (changed.has('activeSnapPointAttr') && this.activeSnapPointAttr !== null) {
      const parsed = this._parseSnapPointValue(this.activeSnapPointAttr);
      if (parsed !== this._activeSnapPoint) {
        this._activeSnapPoint = parsed;
      }
    }
    if (changed.has('snapPointsAttr')) {
      const snapPoints = this._snapPoints;
      if (snapPoints?.length && this._activeSnapPoint === null) {
        this._activeSnapPoint = snapPoints[0] ?? null;
      }
    }
    if (changed.has('_isOpen')) {
      this._onOpenStateChanged(this._isOpen);
    }
    if (changed.has('modal')) {
      if (!this.modal) {
        requestAnimationFrame(() => {
          document.body.style.pointerEvents = 'auto';
        });
      }
    }
  }

  // ─── Snap-points helpers ──────────────────────────────────────────────────

  get _snapPoints(): (number | string)[] | null {
    if (!this.snapPointsAttr) return null;
    try {
      return JSON.parse(this.snapPointsAttr) as (number | string)[];
    } catch {
      return null;
    }
  }

  private _parseSnapPointValue(val: string): number | string | null {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
  }

  private _computeSnapResult() {
    const snapPoints = this._snapPoints;
    if (!snapPoints || !snapPoints.length) return null;

    const fadeFromIndex = this.fadeFromIndex ?? snapPoints.length - 1;
    return createSnapPoints({
      snapPoints,
      fadeFromIndex,
      direction: this.direction,
      drawerEl: this._drawerEl,
      overlayEl: this._overlayEl,
      container: this.container,
      snapToSequentialPoint: this.snapToSequentialPoint,
      activeSnapPoint: this._activeSnapPoint,
      onActiveSnapPointChange: (sp) => {
        this._activeSnapPoint = sp;
        this.activeSnapPointAttr = sp !== null ? String(sp) : null;
        this.dispatchEvent(
          new CustomEvent('vaul-snap-point-change', { detail: { snapPoint: sp }, bubbles: true }),
        );
      },
      onSnapPointIndexChange: (idx) => {
        this._activeSnapPointIndex = idx;
        // Reset openTime when reaching the last snap point to allow scroll
        if (snapPoints && idx === snapPoints.length - 1) {
          this._openTime = new Date();
        }
      },
    });
  }

  // ─── Open / Close ─────────────────────────────────────────────────────────

  private _setOpen(value: boolean) {
    if (!this.dismissible && !value) return;

    if (value && !this._hasBeenOpened) {
      this._hasBeenOpened = true;
    }

    if (!value) {
      this._cancelDrag();
    }

    this._isOpen = value;
    this.open = value;

    this.dispatchEvent(
      new CustomEvent('vaul-open-change', { detail: { open: value }, bubbles: true, composed: true }),
    );
  }

  /** Called by child elements (trigger, close buttons) to open the drawer. */
  openDrawer() {
    if (!this._hasBeenOpened) this._hasBeenOpened = true;
    this._setOpen(true);
  }

  /** Called by child elements and internal logic to close the drawer. */
  closeDrawer(fromWithin = false) {
    this._cancelDrag();
    this.dispatchEvent(new CustomEvent('vaul-close', { bubbles: true }));

    if (!fromWithin) {
      this._setOpen(false);
    } else {
      this._isOpen = false;
      this.open = false;
      this.dispatchEvent(
        new CustomEvent('vaul-open-change', { detail: { open: false }, bubbles: true, composed: true }),
      );
    }

    const snapPoints = this._snapPoints;
    if (snapPoints) {
      setTimeout(() => {
        this._activeSnapPoint = snapPoints[0] ?? null;
        this._activeSnapPointIndex = 0;
      }, TRANSITIONS.DURATION * 1000);
    }
  }

  private _onOpenStateChanged(isOpen: boolean) {
    const snapPoints = this._snapPoints;
    const snapPointResult = this._computeSnapResult();

    if (isOpen) {
      // Make content/overlay visible BEFORE updating attributes so animations play
      if (this._drawerEl) this._drawerEl.style.display = '';
      if (this._overlayEl) this._overlayEl.style.display = '';
    }

    this._updateChildAttributes();

    if (isOpen) {
      set(document.documentElement, { scrollBehavior: 'auto' });
      this._openTime = new Date();

      // Position fixed (Safari)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) setPositionFixed(this.noBodyStyles);
      if (!this.modal) {
        setTimeout(() => restorePositionFixed(this.preventScrollRestoration, this.noBodyStyles), 500);
      }

      // Scale background
      if (this.shouldScaleBackground) {
        this._applyScaleBackground();
      }

      // Prevent scroll
      if (this.modal) {
        this._restoreScroll?.();
        this._restoreScroll = enablePreventScroll();
      }

      if (snapPoints && snapPoints.length && !this._activeSnapPoint) {
        this._activeSnapPoint = snapPoints[0] ?? null;
      }

      // Animate to first snap point
      if (snapPoints && snapPoints.length && snapPointResult && this._drawerEl) {
        const firstOffset = snapPointResult.snapPointsOffset[this._activeSnapPointIndex] ?? 0;
        set(this._drawerEl, {
          transform: isVertical(this.direction)
            ? `translate3d(0, ${firstOffset}px, 0)`
            : `translate3d(${firstOffset}px, 0, 0)`,
        });
      }
    } else {
      reset(document.documentElement, 'scrollBehavior');
      restorePositionFixed(this.preventScrollRestoration, this.noBodyStyles);

      // Remove scale background
      this._scaleBackgroundCleanup?.();
      this._scaleBackgroundCleanup = null;

      // Re-enable scroll
      this._restoreScroll?.();
      this._restoreScroll = null;

      document.body.style.pointerEvents = 'auto';

      // Hide content/overlay after close animation completes
      const drawerEl = this._drawerEl;
      const overlayEl = this._overlayEl;
      setTimeout(() => {
        if (drawerEl) {
          drawerEl.style.display = 'none';
          // Reset transform so re-open animation plays correctly
          drawerEl.style.transform = '';
        }
        if (overlayEl) {
          overlayEl.style.display = 'none';
        }
      }, TRANSITIONS.DURATION * 1000);
    }

    setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('vaul-animation-end', { detail: { open: isOpen }, bubbles: true }),
      );
    }, TRANSITIONS.DURATION * 1000);

    if (isOpen && !this.modal) {
      requestAnimationFrame(() => {
        document.body.style.pointerEvents = 'auto';
      });
    }
  }

  // ─── Child element registration ───────────────────────────────────────────

  /** Called by `<vaul-content>` when it connects. */
  registerContent(el: HTMLElement) {
    this._drawerEl = el;
    // Hide initially unless the drawer is already open
    if (!this._isOpen) {
      el.style.display = 'none';
    }
    this._updateChildAttributes();
  }

  /** Called by `<vaul-overlay>` when it connects. */
  registerOverlay(el: HTMLElement) {
    this._overlayEl = el;
    // Hide initially unless the drawer is already open
    if (!this._isOpen) {
      el.style.display = 'none';
    }
    this._updateChildAttributes();
  }

  // ─── Attribute synchronisation ────────────────────────────────────────────

  private _updateChildAttributes() {
    const snapPoints = this._snapPoints;
    const hasSnapPoints = !!(snapPoints && snapPoints.length > 0);
    const snapResult = hasSnapPoints ? this._computeSnapResult() : null;
    const drawerEl = this._drawerEl;
    const overlayEl = this._overlayEl;

    if (drawerEl) {
      drawerEl.setAttribute('data-vaul-drawer-direction', this.direction);
      drawerEl.setAttribute('data-vaul-drawer', '');
      drawerEl.setAttribute('data-vaul-snap-points', this._isOpen && hasSnapPoints ? 'true' : 'false');
      drawerEl.setAttribute('data-vaul-custom-container', this.container ? 'true' : 'false');
      drawerEl.setAttribute('data-vaul-animate', this._shouldAnimate ? 'true' : 'false');
      drawerEl.setAttribute('data-state', this._isOpen ? 'open' : 'closed');

      if (snapResult && snapResult.snapPointsOffset.length > 0) {
        const offset = snapResult.snapPointsOffset[this._activeSnapPointIndex] ?? 0;
        drawerEl.style.setProperty('--snap-point-height', `${offset}px`);
      }
    }

    if (overlayEl) {
      overlayEl.setAttribute('data-vaul-overlay', '');
      overlayEl.setAttribute('data-vaul-snap-points', this._isOpen && hasSnapPoints ? 'true' : 'false');
      overlayEl.setAttribute(
        'data-vaul-snap-points-overlay',
        this._isOpen && (snapResult?.shouldFade ?? false) ? 'true' : 'false',
      );
      overlayEl.setAttribute('data-vaul-animate', this._shouldAnimate ? 'true' : 'false');
      overlayEl.setAttribute('data-state', this._isOpen ? 'open' : 'closed');
    }
  }

  // ─── Scale background ─────────────────────────────────────────────────────

  private _applyScaleBackground() {
    const wrapper =
      (document.querySelector('[data-vaul-drawer-wrapper]') as HTMLElement) ||
      (document.querySelector('[vaul-drawer-wrapper]') as HTMLElement);
    if (!wrapper) return;

    function getScale() {
      return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
    }

    const restoreWrapper = chain(
      this.setBackgroundColorOnScale && !this.noBodyStyles
        ? assignStyle(document.body, { background: 'black' })
        : () => () => {},
      assignStyle(wrapper, {
        transformOrigin: isVertical(this.direction) ? 'top' : 'left',
        transitionProperty: 'transform, border-radius',
        transitionDuration: `${TRANSITIONS.DURATION}s`,
        transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        borderRadius: `${BORDER_RADIUS}px`,
        overflow: 'hidden',
        ...(isVertical(this.direction)
          ? { transform: `scale(${getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)` }
          : { transform: `scale(${getScale()}) translate3d(calc(env(safe-area-inset-top) + 14px), 0, 0)` }),
      }),
    );

    const timeoutId = { current: 0 };
    this._scaleBackgroundCleanup = () => {
      restoreWrapper();
      timeoutId.current = window.setTimeout(() => {
        if (this._initialBackgroundColor) {
          document.body.style.background = this._initialBackgroundColor;
        } else {
          document.body.style.removeProperty('background');
        }
      }, TRANSITIONS.DURATION * 1000);
    };
  }

  // ─── Drag helpers ─────────────────────────────────────────────────────────

  private _getScale() {
    return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
  }

  private _cancelDrag() {
    if (!this._isDragging || !this._drawerEl) return;
    this._drawerEl.classList.remove(DRAG_CLASS);
    this._isAllowedToDrag = false;
    this._isDragging = false;
    this._dragEndTime = new Date();
  }

  private _resetDrawer() {
    if (!this._drawerEl) return;
    const wrapper = document.querySelector('[data-vaul-drawer-wrapper]');
    const currentSwipeAmount = getTranslate(this._drawerEl, this.direction);

    set(this._drawerEl, {
      transform: 'translate3d(0, 0, 0)',
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
    });

    set(this._overlayEl, {
      transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      opacity: '1',
    });

    if (this.shouldScaleBackground && currentSwipeAmount && currentSwipeAmount > 0 && this._isOpen) {
      set(wrapper as HTMLElement, {
        borderRadius: `${BORDER_RADIUS}px`,
        overflow: 'hidden',
        ...(isVertical(this.direction)
          ? {
              transform: `scale(${this._getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
              transformOrigin: 'top',
            }
          : {
              transform: `scale(${this._getScale()}) translate3d(calc(env(safe-area-inset-top) + 14px), 0, 0)`,
              transformOrigin: 'left',
            }),
        transitionProperty: 'transform, border-radius',
        transitionDuration: `${TRANSITIONS.DURATION}s`,
        transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      });
    }
  }

  private _shouldDrag(el: EventTarget, isDraggingInDirection: boolean): boolean {
    let element = el as HTMLElement;
    const highlightedText = window.getSelection()?.toString();
    const swipeAmount = this._drawerEl ? getTranslate(this._drawerEl, this.direction) : null;
    const date = new Date();

    if (element.tagName === 'SELECT') return false;
    if (element.hasAttribute('data-vaul-no-drag') || element.closest('[data-vaul-no-drag]')) return false;
    if (this.direction === 'right' || this.direction === 'left') return true;

    if (this._openTime && date.getTime() - this._openTime.getTime() < 500) return false;

    if (swipeAmount !== null) {
      if (this.direction === 'bottom' ? swipeAmount > 0 : swipeAmount < 0) return true;
    }

    if (highlightedText && highlightedText.length > 0) return false;

    if (
      this._lastTimeDragPrevented &&
      date.getTime() - this._lastTimeDragPrevented.getTime() < this.scrollLockTimeout &&
      swipeAmount === 0
    ) {
      this._lastTimeDragPrevented = date;
      return false;
    }

    if (isDraggingInDirection) {
      this._lastTimeDragPrevented = date;
      return false;
    }

    while (element) {
      if (element.scrollHeight > element.clientHeight) {
        if (element.scrollTop !== 0) {
          this._lastTimeDragPrevented = new Date();
          return false;
        }
        if (element.getAttribute('role') === 'dialog') return true;
      }
      element = element.parentNode as HTMLElement;
    }

    return true;
  }

  // ─── Public pointer event handlers (called by child elements) ─────────────

  onPress(event: PointerEvent) {
    if (!this.dismissible && !this._snapPoints) return;
    if (this._drawerEl && !this._drawerEl.contains(event.target as Node)) return;

    this._drawerHeight = this._drawerEl?.getBoundingClientRect().height ?? 0;
    this._drawerWidth = this._drawerEl?.getBoundingClientRect().width ?? 0;
    this._isDragging = true;
    this._dragStartTime = new Date();

    if (isIOS()) {
      window.addEventListener('touchend', () => (this._isAllowedToDrag = false), { once: true });
    }

    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this._pointerStart = isVertical(this.direction) ? event.pageY : event.pageX;
  }

  onDrag(event: PointerEvent) {
    if (!this._drawerEl || !this._isDragging) return;

    const directionMultiplier = this.direction === 'bottom' || this.direction === 'right' ? 1 : -1;
    const draggedDistance =
      (this._pointerStart - (isVertical(this.direction) ? event.pageY : event.pageX)) * directionMultiplier;
    const isDraggingInDirection = draggedDistance > 0;

    const snapPoints = this._snapPoints;
    const noCloseSnapPointsPreCondition = snapPoints && !this.dismissible && !isDraggingInDirection;
    if (noCloseSnapPointsPreCondition && this._activeSnapPointIndex === 0) return;

    const absDraggedDistance = Math.abs(draggedDistance);
    const wrapper = document.querySelector('[data-vaul-drawer-wrapper]');
    const drawerDimension =
      this.direction === 'bottom' || this.direction === 'top' ? this._drawerHeight : this._drawerWidth;

    let percentageDragged = absDraggedDistance / drawerDimension;

    if (snapPoints) {
      const snapResult = this._computeSnapResult();
      const snapPointPercentageDragged =
        snapResult?.getPercentageDragged(absDraggedDistance, isDraggingInDirection) ?? null;
      if (snapPointPercentageDragged !== null) {
        percentageDragged = snapPointPercentageDragged;
      }
    }

    if (noCloseSnapPointsPreCondition && percentageDragged >= 1) return;

    if (!this._isAllowedToDrag && !this._shouldDrag(event.target!, isDraggingInDirection)) return;
    this._drawerEl.classList.add(DRAG_CLASS);
    this._isAllowedToDrag = true;

    set(this._drawerEl, { transition: 'none' });
    set(this._overlayEl, { transition: 'none' });

    if (snapPoints) {
      const snapResult = this._computeSnapResult();
      snapResult?.onDrag({ draggedDistance });
    }

    if (isDraggingInDirection && !snapPoints) {
      const dampenedDraggedDistance = dampenValue(draggedDistance);
      const translateValue = Math.min(dampenedDraggedDistance * -1, 0) * directionMultiplier;
      set(this._drawerEl, {
        transform: isVertical(this.direction)
          ? `translate3d(0, ${translateValue}px, 0)`
          : `translate3d(${translateValue}px, 0, 0)`,
      });
      return;
    }

    const opacityValue = 1 - percentageDragged;
    const snapResult = snapPoints ? this._computeSnapResult() : null;

    if (
      snapResult?.shouldFade ||
      (this.fadeFromIndex !== undefined && this._activeSnapPointIndex === this.fadeFromIndex - 1)
    ) {
      this.dispatchEvent(
        new CustomEvent('vaul-drag', { detail: { percentageDragged }, bubbles: true }),
      );
      set(this._overlayEl, { opacity: `${opacityValue}`, transition: 'none' }, true);
    }

    if (wrapper && this._overlayEl && this.shouldScaleBackground) {
      const scaleValue = Math.min(this._getScale() + percentageDragged * (1 - this._getScale()), 1);
      const borderRadiusValue = 8 - percentageDragged * 8;
      const translateValue = Math.max(0, 14 - percentageDragged * 14);
      set(
        wrapper as HTMLElement,
        {
          borderRadius: `${borderRadiusValue}px`,
          transform: isVertical(this.direction)
            ? `scale(${scaleValue}) translate3d(0, ${translateValue}px, 0)`
            : `scale(${scaleValue}) translate3d(${translateValue}px, 0, 0)`,
          transition: 'none',
        },
        true,
      );
    }

    if (!snapPoints) {
      const translateValue = absDraggedDistance * directionMultiplier;
      set(this._drawerEl, {
        transform: isVertical(this.direction)
          ? `translate3d(0, ${translateValue}px, 0)`
          : `translate3d(${translateValue}px, 0, 0)`,
      });
    }
  }

  onRelease(event: PointerEvent | null) {
    if (!this._isDragging || !this._drawerEl) return;

    this._drawerEl.classList.remove(DRAG_CLASS);
    this._isAllowedToDrag = false;
    this._isDragging = false;
    this._dragEndTime = new Date();
    const swipeAmount = getTranslate(this._drawerEl, this.direction);

    if (!event || !this._shouldDrag(event.target!, false) || !swipeAmount || Number.isNaN(swipeAmount)) return;
    if (!this._dragStartTime) return;

    const timeTaken = this._dragEndTime.getTime() - this._dragStartTime.getTime();
    const distMoved = this._pointerStart - (isVertical(this.direction) ? event.pageY : event.pageX);
    const velocity = Math.abs(distMoved) / timeTaken;

    if (velocity > 0.05) {
      this._justReleased = true;
      setTimeout(() => (this._justReleased = false), 200);
    }

    const snapPoints = this._snapPoints;
    if (snapPoints) {
      const directionMultiplier = this.direction === 'bottom' || this.direction === 'right' ? 1 : -1;
      const snapResult = this._computeSnapResult();
      snapResult?.onRelease({
        draggedDistance: distMoved * directionMultiplier,
        closeDrawer: () => this.closeDrawer(),
        velocity,
        dismissible: this.dismissible,
      });
      this.dispatchEvent(
        new CustomEvent('vaul-release', { detail: { open: true }, bubbles: true }),
      );
      return;
    }

    if (this.direction === 'bottom' || this.direction === 'right' ? distMoved > 0 : distMoved < 0) {
      this._resetDrawer();
      this.dispatchEvent(
        new CustomEvent('vaul-release', { detail: { open: true }, bubbles: true }),
      );
      return;
    }

    if (velocity > VELOCITY_THRESHOLD) {
      this.closeDrawer();
      this.dispatchEvent(
        new CustomEvent('vaul-release', { detail: { open: false }, bubbles: true }),
      );
      return;
    }

    const visibleDrawerHeight = Math.min(this._drawerEl.getBoundingClientRect().height ?? 0, window.innerHeight);
    const visibleDrawerWidth = Math.min(this._drawerEl.getBoundingClientRect().width ?? 0, window.innerWidth);
    const isHorizontalSwipe = this.direction === 'left' || this.direction === 'right';

    if (
      Math.abs(swipeAmount) >=
      (isHorizontalSwipe ? visibleDrawerWidth : visibleDrawerHeight) * this.closeThreshold
    ) {
      this.closeDrawer();
      this.dispatchEvent(
        new CustomEvent('vaul-release', { detail: { open: false }, bubbles: true }),
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent('vaul-release', { detail: { open: true }, bubbles: true }),
    );
    this._resetDrawer();
  }

  // ─── Visual-viewport / keyboard handling ─────────────────────────────────

  setupViewportListener() {
    const onResize = () => {
      if (!this._drawerEl || !this.repositionInputs) return;

      const focusedElement = document.activeElement as HTMLElement;
      if (!isInput(focusedElement) && !this._keyboardIsOpen) return;

      const visualViewportHeight = window.visualViewport?.height ?? 0;
      const totalHeight = window.innerHeight;
      let diffFromInitial = totalHeight - visualViewportHeight;
      const drawerHeight = this._drawerEl.getBoundingClientRect().height ?? 0;
      const isTallEnough = drawerHeight > totalHeight * 0.8;

      if (!this._initialDrawerHeight) {
        this._initialDrawerHeight = drawerHeight;
      }

      const offsetFromTop = this._drawerEl.getBoundingClientRect().top;

      if (Math.abs(this._previousDiffFromInitial - diffFromInitial) > 60) {
        this._keyboardIsOpen = !this._keyboardIsOpen;
      }

      const snapPoints = this._snapPoints;
      const snapResult = snapPoints ? this._computeSnapResult() : null;
      if (snapPoints && snapPoints.length > 0 && snapResult) {
        const activeSnapPointHeight = snapResult.snapPointsOffset[this._activeSnapPointIndex] ?? 0;
        diffFromInitial += activeSnapPointHeight;
      }

      this._previousDiffFromInitial = diffFromInitial;

      if (drawerHeight > visualViewportHeight || this._keyboardIsOpen) {
        const height = this._drawerEl.getBoundingClientRect().height;
        let newDrawerHeight = height;

        if (height > visualViewportHeight) {
          newDrawerHeight =
            visualViewportHeight - (isTallEnough ? offsetFromTop : WINDOW_TOP_OFFSET);
        }

        if (this.fixed) {
          this._drawerEl.style.height = `${height - Math.max(diffFromInitial, 0)}px`;
        } else {
          this._drawerEl.style.height = `${Math.max(newDrawerHeight, visualViewportHeight - offsetFromTop)}px`;
        }
      } else if (!isMobileFirefox()) {
        this._drawerEl.style.height = `${this._initialDrawerHeight}px`;
      }

      if (snapPoints && snapPoints.length > 0 && !this._keyboardIsOpen) {
        this._drawerEl.style.bottom = '0px';
      } else {
        this._drawerEl.style.bottom = `${Math.max(diffFromInitial, 0)}px`;
      }
    };

    window.visualViewport?.addEventListener('resize', onResize);
    return () => window.visualViewport?.removeEventListener('resize', onResize);
  }

  // ─── Nested drawer handling ───────────────────────────────────────────────

  onNestedOpenChange(o: boolean) {
    const scale = o ? (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth : 1;
    const initialTranslate = o ? -NESTED_DISPLACEMENT : 0;

    if (this._nestedOpenChangeTimer) clearTimeout(this._nestedOpenChangeTimer);

    set(this._drawerEl, {
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      transform: isVertical(this.direction)
        ? `scale(${scale}) translate3d(0, ${initialTranslate}px, 0)`
        : `scale(${scale}) translate3d(${initialTranslate}px, 0, 0)`,
    });

    if (!o && this._drawerEl) {
      this._nestedOpenChangeTimer = setTimeout(() => {
        if (!this._drawerEl) return;
        const translateValue = getTranslate(this._drawerEl, this.direction);
        set(this._drawerEl, {
          transition: 'none',
          transform: isVertical(this.direction)
            ? `translate3d(0, ${translateValue}px, 0)`
            : `translate3d(${translateValue}px, 0, 0)`,
        });
      }, 500);
    }
  }

  onNestedDrag(_event: PointerEvent, percentageDragged: number) {
    if (percentageDragged < 0) return;

    const initialScale = (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth;
    const newScale = initialScale + percentageDragged * (1 - initialScale);
    const newTranslate = -NESTED_DISPLACEMENT + percentageDragged * NESTED_DISPLACEMENT;

    set(this._drawerEl, {
      transform: isVertical(this.direction)
        ? `scale(${newScale}) translate3d(0, ${newTranslate}px, 0)`
        : `scale(${newScale}) translate3d(${newTranslate}px, 0, 0)`,
      transition: 'none',
    });
  }

  onNestedRelease(_event: PointerEvent, o: boolean) {
    const dim = isVertical(this.direction) ? window.innerHeight : window.innerWidth;
    const scale = o ? (dim - NESTED_DISPLACEMENT) / dim : 1;
    const translate = o ? -NESTED_DISPLACEMENT : 0;

    if (o) {
      set(this._drawerEl, {
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        transform: isVertical(this.direction)
          ? `scale(${scale}) translate3d(0, ${translate}px, 0)`
          : `scale(${scale}) translate3d(${translate}px, 0, 0)`,
      });
    }
  }

  // ─── Getters used by child elements ──────────────────────────────────────

  get isOpen() {
    return this._isOpen;
  }

  get isDragging() {
    return this._isDragging;
  }

  get shouldFade(): boolean {
    const snapPoints = this._snapPoints;
    if (!snapPoints || !snapPoints.length) return !snapPoints;
    const fadeIdx = this.fadeFromIndex ?? snapPoints.length - 1;
    return snapPoints[fadeIdx] === this._activeSnapPoint;
  }

  get activeSnapPoint() {
    return this._activeSnapPoint;
  }

  get activeSnapPointIndex() {
    return this._activeSnapPointIndex;
  }

  /** Public accessor for the parsed snap-points array. */
  get snapPoints(): (number | string)[] | null {
    return this._snapPoints;
  }

  get snapPointsOffset(): number[] | null {
    return this._computeSnapResult()?.snapPointsOffset ?? null;
  }

  get shouldAnimate() {
    return this._shouldAnimate;
  }

  get keyboardIsOpen() {
    return this._keyboardIsOpen;
  }

  setActiveSnapPoint(sp: number | string | null) {
    this._activeSnapPoint = sp;
    const snapPoints = this._snapPoints;
    if (snapPoints) {
      const idx = snapPoints.findIndex((p) => p === sp);
      if (idx !== -1) this._activeSnapPointIndex = idx;
    }
    this._updateChildAttributes();

    if (this._drawerEl && sp !== null) {
      const snapResult = this._computeSnapResult();
      if (snapResult) {
        const offset = snapResult.snapPointsOffset[this._activeSnapPointIndex] ?? 0;
        set(this._drawerEl, {
          transform: isVertical(this.direction)
            ? `translate3d(0, ${offset}px, 0)`
            : `translate3d(${offset}px, 0, 0)`,
          transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        });
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-root': VaulRoot;
  }
}
