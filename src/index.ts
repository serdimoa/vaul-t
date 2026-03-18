/**
 * Vaul – Drawer web component library built with Lit.
 *
 * Usage:
 * ```html
 * <vaul-root direction="bottom">
 *   <vaul-trigger><button>Open</button></vaul-trigger>
 *   <vaul-portal>
 *     <vaul-overlay class="fixed inset-0 bg-black/40"></vaul-overlay>
 *     <vaul-content class="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl">
 *       <vaul-handle></vaul-handle>
 *       <vaul-close><button>Close</button></vaul-close>
 *       <!-- your content -->
 *     </vaul-content>
 *   </vaul-portal>
 * </vaul-root>
 * ```
 */

// Side-effect: register custom elements
export { VaulRoot } from './vaul-root';
export { VaulOverlay } from './vaul-overlay';
export { VaulContent } from './vaul-content';
export { VaulHandle } from './vaul-handle';
export { VaulTrigger } from './vaul-trigger';
export { VaulClose } from './vaul-close';
export { VaulPortal } from './vaul-portal';

// Utility re-exports
export type { DrawerDirection } from './types';
export { TRANSITIONS, VELOCITY_THRESHOLD, CLOSE_THRESHOLD, SCROLL_LOCK_TIMEOUT } from './constants';
