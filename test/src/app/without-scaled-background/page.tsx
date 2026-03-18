'use client';

import 'vaul';
import { useEffect, useRef, useState } from 'react';
import '../../../vaul.d';

export default function Page() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  // Listen to open/close changes from the web component
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handler = (e: Event) => {
      setOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    root.addEventListener('vaul-open-change', handler);
    return () => root.removeEventListener('vaul-open-change', handler);
  }, []);

  // Sync controlled open state to the web component
  useEffect(() => {
    const root = rootRef.current as any;
    if (!root) return;
    if (open && !root.isOpen) root.openDrawer();
    if (!open && root.isOpen) root.closeDrawer();
  }, [open]);

  return (
    <div className="w-screen h-screen bg-white p-8 flex justify-center items-center" data-vaul-drawer-wrapper="">
      {/* @ts-ignore custom element */}
      <vaul-root ref={rootRef}>
        {/* @ts-ignore custom element */}
        <vaul-trigger>
          <button data-testid="trigger" className="text-2xl">
            Open Drawer
          </button>
        {/* @ts-ignore custom element */}
        </vaul-trigger>
        {/* @ts-ignore custom element */}
        <vaul-portal>
          {/* @ts-ignore custom element */}
          <vaul-overlay data-testid="overlay" class="fixed inset-0 bg-black/40" />
          {/* @ts-ignore custom element */}
          <vaul-content
            data-testid="content"
            class="bg-zinc-100 flex flex-col rounded-t-[10px] h-[96%] mt-24 fixed bottom-0 left-0 right-0"
          >
            {/* @ts-ignore custom element */}
            <vaul-close data-testid="drawer-close">
              <button>Close</button>
            {/* @ts-ignore custom element */}
            </vaul-close>
            <button data-testid="controlled-close" onClick={() => setOpen(false)} className="text-2xl">
              Close
            </button>
            <div className="p-4 bg-white rounded-t-[10px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-8" />
              <div className="max-w-md mx-auto">
                <p className="font-medium mb-4">Unstyled drawer for Lit.</p>
                <p className="text-zinc-600 mb-2">
                  This component can be used as a replacement for a Dialog on mobile and tablet devices.
                </p>
              </div>
            </div>
          {/* @ts-ignore custom element */}
          </vaul-content>
        {/* @ts-ignore custom element */}
        </vaul-portal>
      {/* @ts-ignore custom element */}
      </vaul-root>
    </div>
  );
}
