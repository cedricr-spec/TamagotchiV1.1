import { useEffect } from "react";
import { useEntityStore } from "../store/entitySlice";
import { useWorldStore } from "../store/worldSlice";
import { MAX_ENTITIES, SPAWN_RADIUS } from "../config/spawnConfig";
import { VISIBLE_MARGIN } from "../config/worldConfig";
import { ENTITY_TYPES } from "../config/entityTypes";
import { randomRange } from "../utils/random";

let sessionSeed = Math.random() * 100000;

function createEntityId() {
  return `entity-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSpawnPoint(center, viewport) {
  // mix session seed to avoid identical patterns across reloads
  const angle = (Math.random() + sessionSeed) % 1 * Math.PI * 2;

  const minRadius = Math.max(viewport.width, viewport.height) * 0.5 + 120;
  const maxRadius = minRadius + SPAWN_RADIUS;

  // better randomness (no radial bias)
  const t = Math.random();
  const r = Math.sqrt(
    t * (maxRadius * maxRadius - minRadius * minRadius) +
    minRadius * minRadius
  );

  return {
    x: center.x + Math.cos(angle) * r,
    y: center.y + Math.sin(angle) * r,
  };
}

export default function SpawnSystem() {
  const spawnEntity = useEntityStore((s) => s.spawnEntity);

  useEffect(() => {
    const interval = setInterval(() => {
      const { worldOffset } = useWorldStore.getState();

      const batch = 1; // 🔥 number of entities per tick
      const minRadius = 200;
      const maxRadius = 1200;

      for (let i = 0; i < batch; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);

        const x = -(worldOffset.x || 0) + Math.cos(angle) * radius;
        const y = -(worldOffset.y || 0) + Math.sin(angle) * radius;

        spawnEntity(x, y);
      }
    }, 100); // 🔥 faster spawn rate

    return () => clearInterval(interval);
  }, []);

  return null;
}
