import { usePetStore } from "../store/usePetstore";
import { ENTITY_TYPE_CONFIG } from "../config/entityTypes";
import { distance } from "../utils/spatial";
import { useEffect } from "react";
import { useEntityStore } from "../store/entitySlice";
import { useWorldStore } from "../store/worldSlice";

export function handleInteractions(state) {
  const worldOffset = state.worldOffset || { x: 0, y: 0 };

  const center = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  const petScreen = {
    x: center.x,
    y: center.y,
  };

  return (state.entities || []).filter((entity) => {
    // compute entity screen position (same as EntityLayer)
    const ex = center.x + entity.x + (worldOffset?.x || 0);
    const ey = center.y + entity.y + (worldOffset?.y || 0);

    const radius = ENTITY_TYPE_CONFIG[entity.type]?.interactionRadius || 140;

    return distance({ x: ex, y: ey }, petScreen) <= radius;
  });
}

export default function InteractionSystem() {
  const setEntities = useEntityStore.setState;

  useEffect(() => {
    const interval = setInterval(() => {
      const entities = useEntityStore.getState().entities;
      const worldOffset = useWorldStore.getState().worldOffset;

      const state = {
        entities,
        worldOffset
      };

      // entities in interaction range
      const inRange = handleInteractions(state);
      if (!inRange.length) return;

      const ids = new Set(inRange.map((e) => e.id));

      // apply simple effect per entity (optional)
      const applyAction = usePetStore.getState().applyAction;
      inRange.forEach((e) => {
        if (applyAction) {
          applyAction({
            effects: { happiness: 1 },
          });
        }
      });

      // remove collected entities
      setEntities((s) => ({
        entities: (s.entities || []).filter((e) => !ids.has(e.id)),
      }));
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return null;
}
