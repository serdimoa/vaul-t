'use client';

import 'vaul';
import { useEffect, useRef } from 'react';
import '../../vaul.d';

export default function Page() {
  const outerRootRef = useRef<HTMLElement>(null);
  const innerRootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const outerRoot = outerRootRef.current as any;
    const innerRoot = innerRootRef.current as any;
    if (!outerRoot || !innerRoot) return;

    const handleNestedOpenChange = (e: Event) => {
      outerRoot.onNestedOpenChange((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    const handleNestedDrag = (e: Event) => {
      const { percentageDragged } = (e as CustomEvent<{ percentageDragged: number }>).detail;
      outerRoot.onNestedDrag(e, percentageDragged);
    };
    const handleNestedRelease = (e: Event) => {
      outerRoot.onNestedRelease(e, (e as CustomEvent<{ open: boolean }>).detail.open);
    };

    innerRoot.addEventListener('vaul-open-change', handleNestedOpenChange);
    innerRoot.addEventListener('vaul-drag', handleNestedDrag);
    innerRoot.addEventListener('vaul-release', handleNestedRelease);

    return () => {
      innerRoot.removeEventListener('vaul-open-change', handleNestedOpenChange);
      innerRoot.removeEventListener('vaul-drag', handleNestedDrag);
      innerRoot.removeEventListener('vaul-release', handleNestedRelease);
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-white p-8 flex justify-center items-center" data-vaul-drawer-wrapper="">
      {/* @ts-ignore custom element */}
      <vaul-root ref={outerRootRef}>
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
            class="bg-gray-100 flex flex-col rounded-t-[10px] h-full mt-24 max-h-[96%] fixed bottom-0 left-0 right-0"
          >
            <div className="p-4 bg-white rounded-t-[10px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
              <div className="max-w-md mx-auto">
                <p className="font-medium mb-4">Drawer for React.</p>
                <p className="text-gray-600 mb-2">
                  This component can be used as a Dialog replacement on mobile and tablet devices.
                </p>
                <p className="text-gray-600 mb-2">It comes unstyled and has gesture-driven animations.</p>
                <p className="text-gray-600 mb-6">
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
                {/* @ts-ignore custom element */}
                <vaul-root ref={innerRootRef}>
                  {/* @ts-ignore custom element */}
                  <vaul-trigger>
                    <button
                      data-testid="nested-trigger"
                      className="rounded-md mb-6 w-full bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                    >
                      Open Second Drawer
                    </button>
                  {/* @ts-ignore custom element */}
                  </vaul-trigger>
                  {/* @ts-ignore custom element */}
                  <vaul-portal>
                    {/* @ts-ignore custom element */}
                    <vaul-overlay class="fixed inset-0 bg-black/40" />
                    {/* @ts-ignore custom element */}
                    <vaul-content
                      data-testid="nested-content"
                      class="bg-gray-100 flex flex-col rounded-t-[10px] h-full mt-24 max-h-[94%] fixed bottom-0 left-0 right-0"
                    >
                      {/* @ts-ignore custom element */}
                      <vaul-close>
                        <button data-testid="nested-close">Close</button>
                      {/* @ts-ignore custom element */}
                      </vaul-close>
                      <div className="p-4 bg-white rounded-t-[10px] flex-1">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
                        <div className="max-w-md mx-auto">
                          <p className="font-medium mb-4">This drawer is nested.</p>
                          <p className="text-gray-600 mb-2">
                            Place a <span className="font-mono text-[15px] font-semibold">`vaul-root`</span> inside
                            another drawer and wire up the nested events.
                          </p>
                          <p className="text-gray-600 mb-2">
                            You can view more examples{' '}
                            <a
                              href="https://github.com/emilkowalski/vaul#examples"
                              className="underline"
                              target="_blank"
                            >
                              here
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-100 border-t border-gray-200 mt-auto">
                        <div className="flex gap-6 justify-end max-w-md mx-auto">
                          <a
                            className="text-xs text-gray-600 flex items-center gap-0.25"
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
                            className="text-xs text-gray-600 flex items-center gap-0.25"
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
            </div>
            <div className="p-4 bg-gray-100 border-t border-gray-200 mt-auto">
              <div className="flex gap-6 justify-end max-w-md mx-auto">
                <a
                  className="text-xs text-gray-600 flex items-center gap-0.25"
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
                  className="text-xs text-gray-600 flex items-center gap-0.25"
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
