import { useEffect } from "react";
import { setWorldMovementResolver, useWorldStore } from "../store/worldSlice";
import { useBrokenObjectsStore } from "../store/brokenObjectsStore";
import { getWorldThemeConfig } from "../config/worldThemeConfig";
import {
  DEFAULT_CHARACTER_SCALE,
} from "../config/characterRoster";
import { FRAME_HEIGHT } from "../config/sharedAnimationMap";
import {
  applyWorldAtlasObjectState,
  createWorldAtlasStumpRenderItem,
} from "../utils/worldAtlasData";
import {
  WORLD_ATLAS_COLLISION_VIEWPORT,
  getWorldAtlasCollisionBounds,
  getWorldAtlasCollisionObjects,
  isWorldTerrainBoundsWalkable,
} from "../utils/worldAtlasFamilies";

const PET_SPRITE_HEIGHT = FRAME_HEIGHT * DEFAULT_CHARACTER_SCALE;
const PET_COLLISION_SIZE = 24;

// Shared authoritative footprint — imported by WorldAtlasLayer for debug rendering.
// Fixed-size 24x24 footprint, centered on the pet and bottom-aligned to the feet
// so gameplay collision and debug use the exact same rectangle.
export const PET_COLLISION_FOOTPRINT = {
  width: PET_COLLISION_SIZE,
  height: PET_COLLISION_SIZE,
};

function getBounds(item) {
  return getWorldAtlasCollisionBounds(item);
}

export function getPetCollisionBounds(point) {
  const spriteBottom = point.y + PET_SPRITE_HEIGHT * 0.5;

  return {
    left: point.x - PET_COLLISION_FOOTPRINT.width / 2,
    right: point.x + PET_COLLISION_FOOTPRINT.width / 2,
    top: spriteBottom - PET_COLLISION_FOOTPRINT.height,
    bottom: spriteBottom,
  };
}

function pathIntersectsBounds(fromBounds, toBounds, bounds) {
  const sweptLeft = Math.min(fromBounds.left, toBounds.left);
  const sweptRight = Math.max(fromBounds.right, toBounds.right);
  const sweptTop = Math.min(fromBounds.top, toBounds.top);
  const sweptBottom = Math.max(fromBounds.bottom, toBounds.bottom);

  return !(
    sweptRight < bounds.left ||
    sweptLeft > bounds.right ||
    sweptBottom < bounds.top ||
    sweptTop > bounds.bottom
  );
}

function boundsOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

export default function CollisionSystem() {
  useEffect(() => {
    setWorldMovementResolver(({ worldOffset, dx, dy }) => {
      if (dx === 0 && dy === 0) {
        return { dx, dy };
      }

      const { currentWorldTheme } = useWorldStore.getState();
      const theme = getWorldThemeConfig(currentWorldTheme);
      const previousPet = { x: -worldOffset.x, y: -worldOffset.y };
      const previousBounds = getPetCollisionBounds(previousPet);

      function getCandidateOffset(candidateDx, candidateDy) {
        return {
          x: worldOffset.x + candidateDx,
          y: worldOffset.y + candidateDy,
        };
      }

      const fullCandidateOffset = getCandidateOffset(dx, dy);
      const proposedPet = {
        x: -fullCandidateOffset.x,
        y: -fullCandidateOffset.y,
      };
      const rangeX = WORLD_ATLAS_COLLISION_VIEWPORT.width / 2;
      const rangeY = WORLD_ATLAS_COLLISION_VIEWPORT.height / 2;
      const brokenObjectState = useBrokenObjectsStore.getState();
      const stumpObjects = brokenObjectState?.stumpObjects || {};
      const allItems = getWorldAtlasCollisionObjects(
        proposedPet.x,
        proposedPet.y,
        theme.atlasData,
        WORLD_ATLAS_COLLISION_VIEWPORT
      );
      const baseItems = applyWorldAtlasObjectState(
        allItems,
        theme.atlasData,
        brokenObjectState
      );
      const stumpItems = Object.values(stumpObjects)
        .map((stumpObject) =>
          createWorldAtlasStumpRenderItem(stumpObject, theme.atlasData)
        )
        .filter(Boolean);
      const items = [...baseItems, ...stumpItems];
      const collisionViewportBounds = {
        left: proposedPet.x - rangeX,
        right: proposedPet.x + rangeX,
        top: proposedPet.y - rangeY,
        bottom: proposedPet.y + rangeY,
      };
      const visibleItems = items.filter((item) =>
        boundsOverlap(getBounds(item), collisionViewportBounds)
      );
      const walkableOverrides = visibleItems
        .filter((item) => item.walkableOverride)
        .map((item) => ({ item, bounds: getBounds(item) }));

      function testMove(candidateDx, candidateDy) {
        const candidateOffset = getCandidateOffset(candidateDx, candidateDy);
        const candidatePet = {
          x: -candidateOffset.x,
          y: -candidateOffset.y,
        };
        const candidateBounds = getPetCollisionBounds(candidatePet);
        const swept = {
          left: Math.min(previousBounds.left, candidateBounds.left),
          right: Math.max(previousBounds.right, candidateBounds.right),
          top: Math.min(previousBounds.top, candidateBounds.top),
          bottom: Math.max(previousBounds.bottom, candidateBounds.bottom),
        };

        if (!isWorldTerrainBoundsWalkable(swept)) return false;

        for (const item of visibleItems) {
          if (!item.blocksMovement) continue;
          const bounds = getBounds(item);

          const overridden = walkableOverrides.some(({ bounds: overrideBounds }) => {
            if (!boundsOverlap(bounds, overrideBounds)) return false;
            return (
              boundsOverlap(candidateBounds, overrideBounds) ||
              boundsOverlap(previousBounds, overrideBounds) ||
              pathIntersectsBounds(previousBounds, candidateBounds, overrideBounds)
            );
          });
          if (overridden) continue;

          // If already overlapping this obstacle, allow movement so the player can escape.
          if (boundsOverlap(previousBounds, bounds)) continue;

          if (
            boundsOverlap(candidateBounds, bounds) ||
            pathIntersectsBounds(previousBounds, candidateBounds, bounds)
          ) {
            return false;
          }
        }

        return true;
      }

      if (testMove(dx, dy)) {
        return { dx, dy };
      }

      const resolvedDx = dx !== 0 && testMove(dx, 0) ? dx : 0;
      const resolvedDy = dy !== 0 && testMove(0, dy) ? dy : 0;

      return {
        dx: resolvedDx,
        dy: resolvedDy,
      };
    });

    return () => {
      setWorldMovementResolver(null);
    };
  }, []);

  return null;
}
