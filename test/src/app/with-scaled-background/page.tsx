'use client';

import 'vaul';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import '../../../vaul.d';

type DrawerDirection = 'top' | 'bottom' | 'left' | 'right';

export default function Page() {
  const [direction, setDirection] = useState<DrawerDirection>('bottom');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      if (!detail.open) {/* no controlled state needed */}
    };
    root.addEventListener('vaul-open-change', handler);
    return () => root.removeEventListener('vaul-open-change', handler);
  }, []);

  const contentClass = clsx({
    'bg-zinc-100 flex fixed p-6': true,
    'rounded-t-[10px] flex-col h-[50%] bottom-0 left-0 right-0': direction === 'bottom',
    'rounded-b-[10px] flex-col h-[50%] top-0 left-0 right-0': direction === 'top',
    'rounded-r-[10px] flex-row w-[50%] left-0 top-0 bottom-0': direction === 'left',
    'rounded-l-[10px] flex-row w-[50%] right-0 top-0 bottom-0': direction === 'right',
  });

  return (
    <div
      className="w-screen h-screen bg-white p-8 flex flex-col gap-2 justify-center items-center"
      data-vaul-drawer-wrapper=""
    >
      <select
        value={direction}
        className="border-zinc-300 border-2 px-4 py-1 rounded-lg"
        onChange={(e) => setDirection(e.target.value as DrawerDirection)}
      >
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>
      {/* @ts-ignore custom element */}
      <vaul-root ref={rootRef} should-scale-background direction={direction}>
        {/* @ts-ignore custom element */}
        <vaul-trigger>
          <button data-testid="trigger" className="text-2xl">Open Drawer</button>
        {/* @ts-ignore custom element */}
        </vaul-trigger>
        {/* @ts-ignore custom element */}
        <vaul-portal>
          {/* @ts-ignore custom element */}
          <vaul-overlay data-testid="overlay" class="fixed inset-0 bg-black/40" />
          {/* @ts-ignore custom element */}
          <vaul-content data-testid="content" class={contentClass}>
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-4" />
            <p className="font-medium">Unstyled drawer for Lit.</p>
          {/* @ts-ignore custom element */}
          </vaul-content>
        {/* @ts-ignore custom element */}
        </vaul-portal>
      {/* @ts-ignore custom element */}
      </vaul-root>
    </div>
  );
}
