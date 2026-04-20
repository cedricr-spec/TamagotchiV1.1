import { useEffect } from "react";
import { usePetStore } from "../store/usePetstore";
import { MAX_ENTITIES, SPAWN_RADIUS } from "../config/spawnConfig";
import { VISIBLE_MARGIN } from "../config/worldConfig";
import { ENTITY_TYPES } from "../config/entityTypes";
import { randomRange } from "../utils/random";

function createEntityId() {
  return `entity-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSpawnPoint(center) {
  const angle = Math.random() * Math.PI * 2;
  const radius = randomRange(SPAWN_RADIUS * 0.6, SPAWN_RADIUS);

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function spawnEntities(state, viewport = { width: 0, height: 0 }) {
  const entities = state.entities || [];

  if (entities.length >= MAX_ENTITIES) {
    return entities;
  }

  const center = {
  x: -(state.worldOffset?.x || 0) + (Math.random() - 0.5) * 300,
  y: -(state.worldOffset?.y || 0) + (Math.random() - 0.5) * 300,
};
  const position = getSpawnPoint(center);
  const types = Object.values(ENTITY_TYPES);
  const type = types[Math.floor(randomRange(0, types.length))];

  return [
    ...entities,
    {
      id: createEntityId(),
      type,
      x: position.x,
      y: position.y,
      active: false,
      createdAt: Date.now(),
    },
  ];
}


export default function SpawnSystem() {
  const setState = usePetStore.setState;

  useEffect(() => {
    const interval = setInterval(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      setState((state) => {
        const next = spawnEntities(state, viewport);

        // if spawnEntities returned same array, keep state
        if (next === state.entities) return state;

        // append only NEW entity (last one)
        const newEntity = next[next.length - 1];

        return {
          entities: [...state.entities, newEntity],
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return null;
}
