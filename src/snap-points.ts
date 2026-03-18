import { set, isVertical } from './helpers';
import { TRANSITIONS, VELOCITY_THRESHOLD } from './constants';
import { DrawerDirection } from './types';

export interface SnapPointsOptions {
  snapPoints: (number | string)[];
  fadeFromIndex: number;
  direction: DrawerDirection;
  drawerEl: HTMLElement | null;
  overlayEl: HTMLElement | null;
  container: HTMLElement | null;
  snapToSequentialPoint: boolean;
  activeSnapPoint: number | string | null;
  onActiveSnapPointChange: (snapPoint: number | string | null) => void;
  onSnapPointIndexChange: (index: number) => void;
}

export interface SnapPointsResult {
  snapPointsOffset: number[];
  activeSnapPointIndex: number;
  shouldFade: boolean;
  onDrag: (opts: { draggedDistance: number }) => void;
  onRelease: (opts: {
    draggedDistance: number;
    closeDrawer: () => void;
    velocity: number;
    dismissible: boolean;
  }) => void;
  getPercentageDragged: (absDraggedDistance: number, isDraggingInDirection: boolean) => number | null;
}

function computeOffset(
  snapPoint: number | string,
  direction: DrawerDirection,
  container: HTMLElement | null,
): number {
  const containerWidth = container?.getBoundingClientRect().width ?? window.innerWidth;
  const containerHeight = container?.getBoundingClientRect().height ?? window.innerHeight;

  const isPx = typeof snapPoint === 'string';
  const numeric = isPx ? parseInt(snapPoint as string, 10) : (snapPoint as number);

  if (isVertical(direction)) {
    const height = isPx ? numeric : numeric * containerHeight;
    return direction === 'bottom' ? containerHeight - height : -containerHeight + height;
  }
  const width = isPx ? numeric : numeric * containerWidth;
  return direction === 'right' ? containerWidth - width : -containerWidth + width;
}

export function createSnapPoints(opts: SnapPointsOptions): SnapPointsResult {
  const {
    snapPoints,
    fadeFromIndex,
    direction,
    drawerEl,
    overlayEl,
    container,
    snapToSequentialPoint,
    activeSnapPoint,
    onActiveSnapPointChange,
    onSnapPointIndexChange,
  } = opts;

  const snapPointsOffset = snapPoints.map((sp) => computeOffset(sp, direction, container));

  const activeSnapPointIndex = snapPoints.findIndex((sp) => sp === activeSnapPoint);

  const shouldFade =
    (fadeFromIndex !== undefined &&
      !Number.isNaN(fadeFromIndex) &&
      snapPoints[fadeFromIndex] === activeSnapPoint) ||
    !snapPoints.length;

  function getPercentageDragged(absDraggedDistance: number, isDraggingInDirection: boolean): number | null {
    if (!snapPoints || !drawerEl || activeSnapPointIndex === null) return null;

    const isMovingTowardsSnapPoint = isDraggingInDirection && direction !== 'bottom' && direction !== 'right';
    const isLastSnapPoint = activeSnapPointIndex === snapPoints.length - 1;

    if (isMovingTowardsSnapPoint && isLastSnapPoint) {
      return null;
    }

    const nextSnapPointIndex = isMovingTowardsSnapPoint ? activeSnapPointIndex + 1 : activeSnapPointIndex - 1;
    if (nextSnapPointIndex < 0 || nextSnapPointIndex >= snapPointsOffset.length) return null;

    const nextSnapPointOffset = snapPointsOffset[nextSnapPointIndex];
    const activeSnapPointOffset = snapPointsOffset[activeSnapPointIndex];

    if (activeSnapPointOffset === undefined || nextSnapPointOffset === undefined) return null;

    const snapPointDistance = Math.abs(activeSnapPointOffset - nextSnapPointOffset);
    if (snapPointDistance === 0) return null;

    return Math.min(absDraggedDistance / snapPointDistance, 1);
  }

  function onDrag({ draggedDistance }: { draggedDistance: number }): void {
    if (!drawerEl || activeSnapPointIndex === null) return;

    const directionMultiplier = direction === 'bottom' || direction === 'right' ? 1 : -1;
    const translateValue = snapPointsOffset[activeSnapPointIndex]! + draggedDistance * directionMultiplier;

    set(drawerEl, {
      transform: isVertical(direction)
        ? `translate3d(0, ${translateValue}px, 0)`
        : `translate3d(${translateValue}px, 0, 0)`,
    });
  }

  function onRelease({
    draggedDistance,
    closeDrawer,
    velocity,
    dismissible,
  }: {
    draggedDistance: number;
    closeDrawer: () => void;
    velocity: number;
    dismissible: boolean;
  }): void {
    if (!drawerEl || activeSnapPointIndex === null) return;

    const currentOffset = snapPointsOffset[activeSnapPointIndex] ?? 0;

    const isVelocityHighEnough = velocity > VELOCITY_THRESHOLD;

    const isClosing =
      (direction === 'bottom' || direction === 'right') ? draggedDistance > 0 : draggedDistance < 0;

    // Snap to adjacent point based on velocity direction
    let targetIndex: number;

    if (snapToSequentialPoint || !isVelocityHighEnough) {
      // Find closest snap point to current position
      const currentTranslate = currentOffset + draggedDistance;
      let closestIndex = 0;
      let closestDistance = Infinity;
      snapPointsOffset.forEach((offset, i) => {
        const dist = Math.abs(offset - currentTranslate);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestIndex = i;
        }
      });
      targetIndex = closestIndex;
    } else {
      // Velocity-based: jump to next/prev snap point
      if (isClosing) {
        targetIndex = activeSnapPointIndex - 1;
      } else {
        targetIndex = activeSnapPointIndex + 1;
      }
    }

    if (targetIndex < 0) {
      if (dismissible) {
        closeDrawer();
        return;
      }
      targetIndex = 0;
    }

    if (targetIndex >= snapPoints.length) {
      targetIndex = snapPoints.length - 1;
    }

    const newSnapPoint = snapPoints[targetIndex];
    onActiveSnapPointChange(newSnapPoint ?? null);
    onSnapPointIndexChange(targetIndex);

    const targetOffset = snapPointsOffset[targetIndex] ?? 0;

    set(drawerEl, {
      transform: isVertical(direction)
        ? `translate3d(0, ${targetOffset}px, 0)`
        : `translate3d(${targetOffset}px, 0, 0)`,
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
    });

    if (overlayEl) {
      const isAtFadePoint = targetIndex >= (fadeFromIndex ?? snapPoints.length - 1);
      set(overlayEl, {
        opacity: isAtFadePoint ? '1' : '0',
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      });
    }
  }

  return { snapPointsOffset, activeSnapPointIndex, shouldFade, onDrag, onRelease, getPercentageDragged };
}
