import React from "react";
import Entity from "./Entity";
import { useEntityStore } from "../store/entitySlice";
import { useWorldStore } from "../store/worldSlice";

export default function EntityLayer({ viewport = { width: 0, height: 0 } }) {
  const entities = useEntityStore((state) => state.entities);
  const worldOffset = useWorldStore((state) => state.worldOffset);
  const center = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  return (
    <div
      data-entity-layer
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {entities
        .filter((entity) => entity.active)
        .map((entity) => (
          <Entity
            key={entity.id}
            entity={entity}
            x={center.x + entity.x + (worldOffset?.x || 0)}
            y={center.y + entity.y + (worldOffset?.y || 0)}
          />
        ))}
    </div>
  );
}
