import { useEffect } from "react";
import { usePetStore } from "../store/usePetstore";
import { MAX_DISTANCE } from "../config/worldConfig";
import { distance } from "../utils/spatial";

export function cleanupEntities(state) {
  const petPosition = {
    x: -(state.worldOffset?.x || 0),
    y: -(state.worldOffset?.y || 0),
  };

  return (state.entities || []).filter(
    (entity) => distance(entity, petPosition) <= MAX_DISTANCE
  );
}

export default function CleanupSystem() {
  const setState = usePetStore.setState;

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
