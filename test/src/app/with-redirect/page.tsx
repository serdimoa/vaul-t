'use client';

import 'vaul';
import Link from 'next/link';
import '../../vaul.d';

export default function Page() {
  return (
    <div className="w-screen h-screen bg-white p-8 flex justify-center items-center">
      {/* @ts-ignore custom element */}
      <vaul-root>
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
            <vaul-close>
              <button data-testid="drawer-close">Close</button>
            {/* @ts-ignore custom element */}
            </vaul-close>
            <div className="p-4 bg-white rounded-t-[10px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-8" />
              <div className="max-w-md mx-auto">
                <p className="font-medium mb-4">Redirect to another route.</p>
                <p className="text-zinc-600 mb-2">This route is only used to test the body reset position.</p>
                <p className="text-zinc-600 mb-8">
                  Go to{' '}
                  <Link href="/with-redirect/long-page" data-testid="link" className="underline">
                    another route
                  </Link>{' '}
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
