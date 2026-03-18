/**
 * On Safari/iOS, setting `position: fixed` on the body prevents the page
 * from "jumping" when a drawer opens and the address bar resizes.
 */
import { isSafari } from './browser';

let previousBodyPosition: Record<string, string> | null = null;
let scrollPos = 0;

export function trackScroll(): () => void {
  function onScroll() {
    scrollPos = window.scrollY;
  }
  onScroll();
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}

export function setPositionFixed(noBodyStyles: boolean): void {
  if (!isSafari()) return;
  if (previousBodyPosition !== null || noBodyStyles) return;

  previousBodyPosition = {
    position: document.body.style.position,
    top: document.body.style.top,
    left: document.body.style.left,
    height: document.body.style.height,
    right: 'unset',
  };

  const { scrollX, innerHeight } = window;

  document.body.style.setProperty('position', 'fixed', 'important');
  Object.assign(document.body.style, {
    top: `${-scrollPos}px`,
    left: `${-scrollX}px`,
    right: '0px',
    height: 'auto',
  });

  setTimeout(
    () =>
      requestAnimationFrame(() => {
        const bottomBarHeight = innerHeight - window.innerHeight;
        if (bottomBarHeight && scrollPos >= innerHeight) {
          document.body.style.top = `${-(scrollPos + bottomBarHeight)}px`;
        }
      }),
    300,
  );
}

export function restorePositionFixed(preventScrollRestoration: boolean, noBodyStyles: boolean): void {
  if (!isSafari()) return;
  if (previousBodyPosition === null || noBodyStyles) return;

  const y = -parseInt(document.body.style.top, 10);
  const x = -parseInt(document.body.style.left, 10);

  Object.assign(document.body.style, previousBodyPosition);

  requestAnimationFrame(() => {
    if (preventScrollRestoration) return;
    window.scrollTo(x, y);
  });

  previousBodyPosition = null;
}
