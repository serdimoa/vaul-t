'use client';

import 'vaul';
import { useEffect, useRef } from 'react';
import '../../vaul.d';

function Default() {
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const portal = portalRef.current as any;
    if (!portal || !containerRef.current) return;
    portal.container = containerRef.current;
  }, []);

  return (
    <div className="flex flex-col items-center gap-10">
      <h1 className="text-3xl font-semibold">Default</h1>
      <div
        ref={containerRef}
        className="bg-zinc-200 w-[440px] h-[400px] rounded-lg relative flex justify-center items-center overflow-hidden"
      >
        {/* @ts-ignore custom element */}
        <vaul-root>
          {/* @ts-ignore custom element */}
          <vaul-trigger>Open Drawer</vaul-trigger>
          {/* @ts-ignore custom element */}
          <vaul-portal ref={portalRef}>
            {/* @ts-ignore custom element */}
            <vaul-overlay class="absolute inset-0 bg-black/40" />
            {/* @ts-ignore custom element */}
            <vaul-content class="absolute bg-zinc-100 inset-x-0 rounded-t-[10px] bottom-0 h-[56%] p-6">
              <p className="font-medium">Unstyled drawer for React.</p>
            {/* @ts-ignore custom element */}
            </vaul-content>
          {/* @ts-ignore custom element */}
          </vaul-portal>
        {/* @ts-ignore custom element */}
        </vaul-root>
      </div>
    </div>
  );
}

function WithNested() {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerPortalRef = useRef<HTMLElement>(null);
  const outerRootRef = useRef<HTMLElement>(null);
  const innerRootRef = useRef<HTMLElement>(null);
  const innerPortalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const outerPortal = outerPortalRef.current as any;
    const innerPortal = innerPortalRef.current as any;
    if (!containerRef.current) return;
    if (outerPortal) outerPortal.container = containerRef.current;
    if (innerPortal) innerPortal.container = containerRef.current;
  }, []);

  useEffect(() => {
    const outerRoot = outerRootRef.current as any;
    const innerRoot = innerRootRef.current as any;
    if (!outerRoot || !innerRoot) return;

    const handleNestedOpenChange = (e: Event) => {
      outerRoot.onNestedOpenChange((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    const handleNestedDrag = (e: Event) => {
      outerRoot.onNestedDrag(e, (e as CustomEvent<{ percentageDragged: number }>).detail.percentageDragged);
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
    <div className="flex flex-col items-center gap-10">
      <h1 className="text-3xl font-semibold">With Nested</h1>
      <div
        ref={containerRef}
        className="bg-zinc-200 w-[440px] h-[400px] rounded-lg relative flex justify-center items-center overflow-hidden"
      >
        {/* @ts-ignore custom element */}
        <vaul-root ref={outerRootRef}>
          {/* @ts-ignore custom element */}
          <vaul-trigger>Open Drawer</vaul-trigger>
          {/* @ts-ignore custom element */}
          <vaul-portal ref={outerPortalRef}>
            {/* @ts-ignore custom element */}
            <vaul-overlay class="absolute inset-0 bg-black/40" />
            {/* @ts-ignore custom element */}
            <vaul-content class="absolute bg-zinc-100 inset-x-0 rounded-t-[10px] bottom-0 h-[56%] p-6">
              <p className="font-medium">Unstyled drawer for React.</p>
              {/* @ts-ignore custom element */}
              <vaul-root ref={innerRootRef}>
                {/* @ts-ignore custom element */}
                <vaul-trigger>Open nested drawer</vaul-trigger>
                {/* @ts-ignore custom element */}
                <vaul-portal ref={innerPortalRef}>
                  {/* @ts-ignore custom element */}
                  <vaul-overlay class="absolute inset-0 bg-black/40" />
                  {/* @ts-ignore custom element */}
                  <vaul-content class="absolute bg-zinc-100 inset-x-0 rounded-t-[10px] bottom-0 h-[56%] p-6">
                    <p className="font-medium">Unstyled drawer for React.</p>
                  {/* @ts-ignore custom element */}
                  </vaul-content>
                {/* @ts-ignore custom element */}
                </vaul-portal>
              {/* @ts-ignore custom element */}
              </vaul-root>
            {/* @ts-ignore custom element */}
            </vaul-content>
          {/* @ts-ignore custom element */}
          </vaul-portal>
        {/* @ts-ignore custom element */}
        </vaul-root>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="h-screen flex flex-col gap-20 overflow-auto py-20">
      <Default />
      <WithNested />
    </div>
  );
}
