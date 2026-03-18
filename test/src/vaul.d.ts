/**
 * TypeScript intrinsic element declarations for Vaul web components.
 * This allows using vaul-* tags directly in React/Next.js JSX.
 */

import type { VaulRoot } from 'vaul';

type StringBoolean = 'true' | 'false';

interface VaulRootElement extends Partial<VaulRoot> {
  class?: string;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  'close-threshold'?: number | string;
  'scroll-lock-timeout'?: number | string;
  dismissible?: boolean | StringBoolean;
  'handle-only'?: boolean | StringBoolean;
  'snap-points'?: string;
  'fade-from-index'?: number | string;
  'active-snap-point'?: string;
  'should-scale-background'?: boolean | StringBoolean;
  'set-background-color-on-scale'?: boolean | StringBoolean;
  'no-body-styles'?: boolean | StringBoolean;
  modal?: boolean | StringBoolean;
  fixed?: boolean | StringBoolean;
  'snap-to-sequential-point'?: boolean | StringBoolean;
  'prevent-scroll-restoration'?: boolean | StringBoolean;
  'reposition-inputs'?: boolean | StringBoolean;
  'auto-focus'?: boolean | StringBoolean;
  /** Controlled open state */
  open?: boolean;
  /** Uncontrolled default-open state */
  'default-open'?: boolean;

  // React event handlers mapped to custom events
  onVaulOpenChange?: (e: CustomEvent<{ open: boolean }>) => void;
  onVaulClose?: (e: CustomEvent) => void;
  onVaulDrag?: (e: CustomEvent<{ percentageDragged: number }>) => void;
  onVaulRelease?: (e: CustomEvent<{ open: boolean }>) => void;
  onVaulAnimationEnd?: (e: CustomEvent<{ open: boolean }>) => void;
  onVaulSnapPointChange?: (e: CustomEvent<{ snapPoint: number | string | null }>) => void;

  // Standard HTML attributes
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  id?: string;
}

interface VaulOverlayElement {
  class?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  id?: string;
}

interface VaulContentElement {
  class?: string;
  'data-testid'?: string;
  'handle-only'?: boolean;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  id?: string;
}

interface VaulHandleElement {
  class?: string;
  'prevent-cycle'?: boolean;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  id?: string;
}

interface VaulTriggerElement {
  class?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  id?: string;
}

interface VaulCloseElement {
  class?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  id?: string;
}

interface VaulPortalElement {
  class?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  id?: string;
}

declare namespace JSX {
  interface IntrinsicElements {
    'vaul-root': VaulRootElement;
    'vaul-overlay': VaulOverlayElement;
    'vaul-content': VaulContentElement;
    'vaul-handle': VaulHandleElement;
    'vaul-trigger': VaulTriggerElement;
    'vaul-close': VaulCloseElement;
    'vaul-portal': VaulPortalElement;
  }
}

export {};
