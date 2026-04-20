import { usePetStore } from "../store/usePetstore";
import { ENTITY_TYPE_CONFIG } from "../config/entityTypes";
import { distance } from "../utils/spatial";
import { useEffect } from "react";
import { useEntityStore } from "../store/entitySlice";
import { useWorldStore } from "../store/worldSlice";

export function handleInteractions(state) {
  const worldOffset = state.worldOffset || { x: 0, y: 0 };

  return (state.entities || []).filter((entity) => {
    // convert entity → screen space (match EntityLayer EXACTLY)
    const ex = entity.x + (worldOffset?.x || 0);
    const ey = entity.y + (worldOffset?.y || 0);

    const radius = ENTITY_TYPE_CONFIG[entity.type]?.interactionRadius || 150;

    // pet is always at (0,0) in world-relative screen space
    return distance(
      { x: ex, y: ey },
      { x: 0, y: 0 }
    ) <= radius;
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