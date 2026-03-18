/**
 * Prevents scrolling on the document body and, on iOS, uses the position-fixed
 * trick to avoid the "bounce" / address-bar-resize bug.
 *
 * Adapted from https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/overlays/src/usePreventScroll.ts
 */

import { isIOS } from './browser';

export function isScrollable(node: Element): boolean {
  const style = window.getComputedStyle(node);
  return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);
}

export function getScrollParent(node: Element): Element {
  if (isScrollable(node)) {
    node = node.parentElement as HTMLElement;
  }
  while (node && !isScrollable(node)) {
    node = node.parentElement as HTMLElement;
  }
  return node || document.scrollingElement || document.documentElement;
}

export function isInput(element: HTMLElement): boolean {
  return (
    (element.tagName === 'INPUT' &&
      !['checkbox', 'radio', 'range', 'color', 'file', 'image', 'button', 'submit', 'reset'].includes(
        (element as HTMLInputElement).type,
      )) ||
    element.tagName === 'TEXTAREA' ||
    element.contentEditable === 'true'
  );
}

let preventScrollCount = 0;
let restoreScroll: (() => void) | null = null;

export function enablePreventScroll(): () => void {
  preventScrollCount++;
  if (preventScrollCount === 1) {
    if (isIOS()) {
      restoreScroll = preventScrollMobileSafari();
    } else {
      restoreScroll = preventScrollStandard();
    }
  }
  return disablePreventScroll;
}

function disablePreventScroll(): void {
  preventScrollCount = Math.max(0, preventScrollCount - 1);
  if (preventScrollCount === 0 && restoreScroll) {
    restoreScroll();
    restoreScroll = null;
  }
}

function preventScrollStandard(): () => void {
  return chain(
    setStyle(document.documentElement, 'paddingRight', `${window.innerWidth - document.documentElement.clientWidth}px`),
    setStyle(document.documentElement, 'overflow', 'hidden'),
  );
}

function preventScrollMobileSafari(): () => void {
  let scrollable: Element;
  let lastY = 0;

  const onTouchStart = (e: TouchEvent) => {
    scrollable = getScrollParent(e.target as Element);
    if (scrollable === document.documentElement && scrollable === document.body) {
      return;
    }
    lastY = e.changedTouches[0]!.pageY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (
      !scrollable ||
      scrollable === document.documentElement ||
      scrollable === document.body
    ) {
      e.preventDefault();
      return;
    }

    const y = e.changedTouches[0]!.pageY;
    const scrollTop = scrollable.scrollTop;
    const bottom = scrollable.scrollHeight - scrollable.clientHeight;

    if (bottom === 0 || (scrollTop <= 0 && y > lastY) || (scrollTop >= bottom && y < lastY)) {
      e.preventDefault();
    }
    lastY = y;
  };

  const onTouchEnd = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (isInput(target)) {
      target.style.transform = 'translateY(-2000px)';
      target.focus();
      requestAnimationFrame(() => {
        target.style.transform = '';
      });
    }
  };

  document.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  document.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });

  const restoreStyle = chain(
    setStyle(document.documentElement, 'overflow', 'hidden'),
    setStyle(document.body, 'overflow', 'hidden'),
  );

  return () => {
    restoreStyle();
    document.removeEventListener('touchstart', onTouchStart, true);
    document.removeEventListener('touchmove', onTouchMove, true);
    document.removeEventListener('touchend', onTouchEnd, true);
  };
}

function setStyle(el: HTMLElement, prop: string, value: string): () => void {
  const old = (el.style as unknown as Record<string, string>)[prop] ?? '';
  (el.style as unknown as Record<string, string>)[prop] = value;
  return () => {
    (el.style as unknown as Record<string, string>)[prop] = old;
  };
}

function chain(...fns: Array<() => void>): () => void {
  return () => fns.forEach((f) => f());
}
