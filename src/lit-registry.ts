/**
 * Global registry that maps a root element's unique ID to its VaulRoot instance.
 * Used by portalled elements that have been teleported out of the VaulRoot DOM subtree.
 */

// Forward-declare to avoid circular imports – the actual class is assigned at runtime.
export interface VaulRootElement extends HTMLElement {
  readonly uid: string;
}

const registry = new Map<string, VaulRootElement>();

export function registerRoot(root: VaulRootElement): void {
  registry.set(root.uid, root);
}

export function unregisterRoot(root: VaulRootElement): void {
  registry.delete(root.uid);
}

/**
 * Find the VaulRoot element that owns `el`.
 * First tries a straight DOM ancestor walk; if that fails (element has been
 * portalled) it falls back to the `data-vaul-root-id` data attribute which
 * VaulPortal stamps on every teleported child.
 */
export function findRoot(el: Element): VaulRootElement | null {
  // Walk up the live DOM tree first
  let node: Element | null = el;
  while (node) {
    if (node.tagName === 'VAUL-ROOT') return node as VaulRootElement;
    node = node.parentElement;
  }

  // Teleported elements: look for the closest element that carries the root-id
  // stamp (VaulPortal sets this on the portalled wrapper).
  const stamp =
    (el as HTMLElement).dataset?.vaulRootId ??
    el.closest('[data-vaul-root-id]')?.getAttribute('data-vaul-root-id');
  if (stamp) return registry.get(stamp) ?? null;

  return null;
}
