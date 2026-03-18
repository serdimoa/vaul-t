'use client';

import 'vaul';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import '../../vaul.d';

const snapPoints = [0, '148px', '355px', 1];

export default function Page() {
  const [snap, setSnap] = useState<number | string | null>(snapPoints[1]);
  const rootRef = useRef<HTMLElement>(null);

  const activeSnapPointIndex = snapPoints.findIndex((s) => String(s) === String(snap));

  useEffect(() => {
    const root = rootRef.current as any;
    if (!root) return;
    // Set initial snap point to index 1 programmatically
    root.setActiveSnapPoint(snapPoints[1]);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handler = (e: Event) => {
      const { snapPoint } = (e as CustomEvent<{ snapPoint: number | string | null }>).detail;
      setSnap(snapPoint);
    };
    root.addEventListener('vaul-snap-point-change', handler);
    return () => root.removeEventListener('vaul-snap-point-change', handler);
  }, []);

  return (
    <div className="w-screen h-screen bg-white p-8 flex justify-center items-center">
      <div data-testid="active-snap-index">{activeSnapPointIndex}</div>
      {/* @ts-ignore custom element */}
      <vaul-root ref={rootRef} default-open snap-points={JSON.stringify(snapPoints)}>
        {/* @ts-ignore custom element */}
        <vaul-trigger>
          <button data-testid="trigger">Open Drawer</button>
        {/* @ts-ignore custom element */}
        </vaul-trigger>
        {/* @ts-ignore custom element */}
        <vaul-overlay class="fixed inset-0 bg-black/40" />
        {/* @ts-ignore custom element */}
        <vaul-portal>
          {/* @ts-ignore custom element */}
          <vaul-content
            data-testid="content"
            class="fixed flex flex-col bg-white border border-gray-200 border-b-none rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] mx-[-1px]"
          >
            <div
              className={clsx('flex flex-col max-w-md mx-auto w-full p-4 pt-5', {
                'overflow-y-auto': snap === 1,
                'overflow-hidden': snap !== 1,
              })}
            >
              <h1 className="text-2xl mt-2 font-medium">The Hidden Details</h1>
              <p className="text-sm mt-1 text-gray-600 mb-6">2 modules, 27 hours of video</p>
              <p className="text-gray-600">
                The world of user interface design is an intricate landscape filled with hidden details and nuance. In
                this course, you will learn something cool. To the untrained eye, a beautifully designed UI.
              </p>
              <button className="bg-black text-gray-50 mt-8 rounded-md h-[48px] flex-shrink-0 font-medium">
                Buy for $199
              </button>
              <div className="mt-12">
                <h2 className="text-xl font-medium">Module 01. The Details</h2>
                <div className="space-y-4 mt-4">
                  <div>
                    <span className="block">Layers of UI</span>
                    <span className="text-gray-600">A basic introduction to Layers of Design.</span>
                  </div>
                  <div>
                    <span className="block">Typography</span>
                    <span className="text-gray-600">The fundamentals of type.</span>
                  </div>
                  <div>
                    <span className="block">UI Animations</span>
                    <span className="text-gray-600">Going through the right easings and durations.</span>
                  </div>
                </div>
              </div>
              <div className="mt-12">
                <figure>
                  <blockquote className="font-serif">
                    &ldquo;I especially loved the hidden details video. That was so useful, learned a lot by just
                    reading it. Can&rsquo;t wait for more course content!&rdquo;
                  </blockquote>
                  <figcaption>
                    <span className="text-sm text-gray-600 mt-2 block">Yvonne Ray, Frontend Developer</span>
                  </figcaption>
                </figure>
              </div>
              <div className="mt-12">
                <h2 className="text-xl font-medium">Module 02. The Process</h2>
                <div className="space-y-4 mt-4">
                  <div>
                    <span className="block">Build</span>
                    <span className="text-gray-600">Create cool components to practice.</span>
                  </div>
                  <div>
                    <span className="block">User Insight</span>
                    <span className="text-gray-600">Find out what users think and fine-tune.</span>
                  </div>
                  <div>
                    <span className="block">Putting it all together</span>
                    <span className="text-gray-600">Let&apos;s build an app together and apply everything.</span>
                  </div>
                </div>
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
