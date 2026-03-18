import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { VaulRoot } from './vaul-root';
import { findRoot } from './lit-registry';

/**
 * `<vaul-portal>` teleports its children to `document.body` (or a custom
 * `container` element) to ensure `position: fixed` children are not clipped
 * by ancestor `overflow` or `transform` rules.
 *
 * The element stamps each teleported child with `data-vaul-root-id` so that
 * the global registry can locate the parent `<vaul-root>` after the move.
 */
@customElement('vaul-portal')
export class VaulPortal extends LitElement {
  /** Custom container element.  Defaults to `document.body`. */
  @property({ attribute: false }) container: HTMLElement | null = null;

  private _root: VaulRoot | null = null;
  private _teleportedNodes: Node[] = [];

  // VaulPortal intentionally renders nothing itself – all children are moved.
  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._root = findRoot(this) as VaulRoot | null;

    // Use the container from the root element if not explicitly overridden.
    const target = this.container ?? this._root?.container ?? document.body;

    // Move each child element to the target container.
    const children = Array.from(this.childNodes);
    for (const child of children) {
      if (child instanceof HTMLElement) {
        // Stamp the root-id for post-teleport registry lookups.
        if (this._root) {
          child.dataset['vaulRootId'] = this._root.uid;
          // Propagate the root-id to deeper custom elements inside the child.
          child.querySelectorAll<HTMLElement>('[data-vaul-root-id]').forEach((el) => {
            el.dataset['vaulRootId'] = this._root!.uid;
          });
        }
        target.appendChild(child);
        this._teleportedNodes.push(child);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Return teleported nodes to the portal element before it is removed so
    // that Lit can clean up their lifecycle callbacks properly.
    for (const node of this._teleportedNodes) {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
    this._teleportedNodes = [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vaul-portal': VaulPortal;
  }
}
