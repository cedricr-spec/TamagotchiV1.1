import { VISIBLE_MARGIN } from "../config/worldConfig";
import { isInBounds } from "../utils/spatial";

import { useEffect } from "react";
import { usePetStore } from "../store/usePetstore";

export function updateVisibility(state, viewport = { width: 0, height: 0 }) {
  const worldOffset = state.worldOffset || { x: 0, y: 0 };
  const halfWidth = viewport.width / 2;
  const halfHeight = viewport.height / 2;

  const bounds = {
    left: -worldOffset.x - halfWidth - VISIBLE_MARGIN,
    right: -worldOffset.x + halfWidth + VISIBLE_MARGIN,
    top: -worldOffset.y - halfHeight - VISIBLE_MARGIN,
    bottom: -worldOffset.y + halfHeight + VISIBLE_MARGIN,
  };

  return (state.entities || []).map((entity) => ({
    ...entity,
    active: isInBounds(entity, bounds),
  }));
}

export default function VisibilitySystem() {
  const setState = usePetStore.setState;

  useEffect(() => {
    const interval = setInterval(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      setState((state) => ({
        entities: updateVisibility(state, viewport),
      }));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return null;
}
