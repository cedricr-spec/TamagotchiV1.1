import { useEffect } from "react";
import { useWorldStore } from "../store/worldSlice";
import { DECOR_CONFIG, getTreesAround, getRocksAround } from "../utils/decorGenerator";
import { getDecorCollisionBounds } from "../utils/decorBounds";

const PET_WIDTH = 50;
const PET_HEIGHT = 50;

function getPetBounds(pet) {
  return {
    left: pet.x - PET_WIDTH / 2,
    right: pet.x + PET_WIDTH / 2,
    top: pet.y - PET_HEIGHT,
    bottom: pet.y,
  };
}

function boundsIntersect(a, b) {
  return (
    a.right > b.left &&
    a.left < b.right &&
    a.bottom > b.top &&
    a.top < b.bottom
  );
}

function getBoundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  };
}

function resolveAxisDirection(movement, petBounds, obstacleBounds, axis) {
  if (axis === "x") {
    if (movement.x > 0) return -1;
    if (movement.x < 0) return 1;
  } else {
    if (movement.y > 0) return -1;
    if (movement.y < 0) return 1;
  }

  const petCenter = getBoundsCenter(petBounds);
  const obstacleCenter = getBoundsCenter(obstacleBounds);

  if (axis === "x") {
    return petCenter.x < obstacleCenter.x ? -1 : 1;
  }

  return petCenter.y < obstacleCenter.y ? -1 : 1;
}

function resolvePetAgainstBounds(pet, previousPet, obstacleBounds) {
  const petBounds = getPetBounds(pet);

  if (!boundsIntersect(petBounds, obstacleBounds)) {
    return pet;
  }

  const overlapX = Math.min(
    petBounds.right - obstacleBounds.left,
    obstacleBounds.right - petBounds.left
  );
  const overlapY = Math.min(
    petBounds.bottom - obstacleBounds.top,
    obstacleBounds.bottom - petBounds.top
  );
  const movement = {
    x: pet.x - previousPet.x,
    y: pet.y - previousPet.y,
  };
  const resolveHorizontally =
    overlapX < overlapY ||
    (overlapX === overlapY && Math.abs(movement.x) >= Math.abs(movement.y));

  if (resolveHorizontally) {
    const direction = resolveAxisDirection(movement, petBounds, obstacleBounds, "x");
    return {
      x: pet.x + overlapX * direction,
      y: pet.y,
    };
  }

  const direction = resolveAxisDirection(movement, petBounds, obstacleBounds, "y");
  return {
    x: pet.x,
    y: pet.y + overlapY * direction,
  };
}

export default function CollisionSystem() {
  useEffect(() => {
    let frameId = 0;
    let lastOffset = useWorldStore.getState().worldOffset;

    const loop = () => {
      const { worldOffset } = useWorldStore.getState();
      const previousPet = {
        x: -lastOffset.x,
        y: -lastOffset.y,
      };
      const currentPet = {
        x: -worldOffset.x,
        y: -worldOffset.y,
      };
      const rangeX = DECOR_CONFIG.rangeX ?? DECOR_CONFIG.range;
      const rangeY = DECOR_CONFIG.rangeY ?? DECOR_CONFIG.range;
      const items = [
        ...getTreesAround(currentPet.x, currentPet.y),
        ...getRocksAround(currentPet.x, currentPet.y),
      ];
      const visibleItems = items.filter((item) => {
        const dx = item.x - currentPet.x;
        const dy = item.y - currentPet.y;
        return Math.abs(dx) < rangeX && Math.abs(dy) < rangeY;
      });

      let resolvedPet = currentPet;

      for (const item of visibleItems) {
        resolvedPet = resolvePetAgainstBounds(
          resolvedPet,
          previousPet,
          getDecorCollisionBounds(item)
        );
      }

      const nextOffset = {
        x: -resolvedPet.x,
        y: -resolvedPet.y,
      };

      if (nextOffset.x !== worldOffset.x || nextOffset.y !== worldOffset.y) {
        useWorldStore.setState({ worldOffset: nextOffset });
      }

      lastOffset = nextOffset;
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return null;
}
