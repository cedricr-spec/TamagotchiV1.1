import React from "react";
import Entity from "./Entity";
import { useEntityStore } from "../store/entitySlice";
import { useWorldStore } from "../store/worldSlice";

export default function EntityLayer({ viewport = { width: 0, height: 0 } }) {
  const entities = useEntityStore((state) => state.entities);
  const worldOffset = useWorldStore((state) => state.worldOffset);

  return (
    <div
      data-entity-layer
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
      }}
    >
      {entities
        .filter((entity) => entity.active)
        .map((entity) => (
          <Entity
            key={entity.id}
            entity={entity}
            x={entity.x + (worldOffset?.x || 0)}
            y={entity.y + (worldOffset?.y || 0)}
          />
        ))}
    </div>
  );
}
