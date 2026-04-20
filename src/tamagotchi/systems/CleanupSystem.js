import { useEffect } from "react";
import { useEntityStore } from "../store/entitySlice";
import { MAX_DISTANCE } from "../config/worldConfig";
import { distance } from "../utils/spatial";

export function cleanupEntities(state) {
  const worldOffset = state.worldOffset || { x: 0, y: 0 };

  return (state.entities || []).filter((entity) => {
    const ex = entity.x + (worldOffset.x || 0);
    const ey = entity.y + (worldOffset.y || 0);

    const dist = Math.sqrt(ex * ex + ey * ey);

    return dist <= MAX_DISTANCE;
  });
}

export default function CleanupSystem() {
  const setState = useEntityStore.setState;

  useEffect(() => {
    const interval = setInterval(() => {
      setState((state) => ({
        entities: cleanupEntities(state),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
