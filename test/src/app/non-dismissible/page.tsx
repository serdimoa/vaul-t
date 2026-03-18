'use client';

import 'vaul';
import { useEffect, useRef } from 'react';
import '../../vaul.d';

export default function Page() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current as any;
    if (!root) return;
    // dismissible defaults to true in the WC; set to false programmatically
    root.dismissible = false;
  }, []);

  const handleDismiss = () => {
    const root = rootRef.current as any;
    if (root) root.closeDrawer();
  };

  return (
    <div className="w-screen h-screen bg-white p-8 flex justify-center items-center" data-vaul-drawer-wrapper="">
      {/* @ts-ignore custom element */}
      <vaul-root ref={rootRef}>
        {/* @ts-ignore custom element */}
        <vaul-trigger>
          <button data-testid="trigger">Open Drawer</button>
        {/* @ts-ignore custom element */}
        </vaul-trigger>
        {/* @ts-ignore custom element */}
        <vaul-portal>
          {/* @ts-ignore custom element */}
          <vaul-overlay class="fixed inset-0 bg-black/40" />
          {/* @ts-ignore custom element */}
          <vaul-content
            data-testid="content"
            class="bg-zinc-100 flex flex-col rounded-t-[10px] mt-24 fixed bottom-0 left-0 right-0"
          >
            <div className="p-4 bg-white rounded-t-[10px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-8" />
              <div className="max-w-md mx-auto">
                <p className="font-medium mb-4">Unstyled drawer for React.</p>
                <p className="text-zinc-600 mb-2">
                  This component can be used as a replacement for a Dialog on mobile and tablet devices.
                </p>
                <p className="text-zinc-600 mb-6">
                  It uses{' '}
                  <a
                    href="https://www.radix-ui.com/docs/primitives/components/dialog"
                    className="underline"
                    target="_blank"
                  >
                    Radix&rsquo;s Dialog primitive
                  </a>{' '}
                  under the hood and is inspired by{' '}
                  <a
                    href="https://twitter.com/devongovett/status/1674470185783402496"
                    className="underline"
                    target="_blank"
                  >
                    this tweet.
                  </a>
                </p>

                <button
                  type="button"
                  data-testid="dismiss-button"
                  onClick={handleDismiss}
                  className="rounded-md mb-6 w-full bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                >
                  Click to close
                </button>
              </div>
            </div>
            <div className="p-4 bg-zinc-100 border-t border-zinc-200 mt-auto">
              <div className="flex gap-6 justify-end max-w-md mx-auto">
                <a
                  className="text-xs text-zinc-600 flex items-center gap-0.25"
                  href="https://github.com/emilkowalski/vaul"
                  target="_blank"
                >
                  GitHub
                  <svg
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                    aria-hidden="true"
                    className="w-3 h-3 ml-1"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                    <path d="M15 3h6v6"></path>
                    <path d="M10 14L21 3"></path>
                  </svg>
                </a>
                <a
                  className="text-xs text-zinc-600 flex items-center gap-0.25"
                  href="https://twitter.com/emilkowalski_"
                  target="_blank"
                >
                  Twitter
                  <svg
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                    aria-hidden="true"
                    className="w-3 h-3 ml-1"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                    <path d="M15 3h6v6"></path>
                    <path d="M10 14L21 3"></path>
                  </svg>
                </a>
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
