import React from "react";
import { useWorldStore } from "../store/worldSlice";
import tree1 from "../../spritesheets/trees/tree1.webp";
import tree2 from "../../spritesheets/trees/tree2.webp";
import tree3 from "../../spritesheets/trees/tree3.webp";
import tree4 from "../../spritesheets/trees/tree4.webp";
import tree5 from "../../spritesheets/trees/tree5.webp";
import tree6 from "../../spritesheets/trees/tree6.webp";
import tree7 from "../../spritesheets/trees/tree7.webp";
import tree8 from "../../spritesheets/trees/tree8.webp";
import { getTreesAround, DECOR_CONFIG } from "../utils/decorGenerator";

export default function DecorLayer() {
  const worldOffset = useWorldStore((s) => s.worldOffset);

  const TREE_ASSETS = [tree1, tree2, tree3, tree4, tree5, tree6, tree7, tree8];

  const playerX = -worldOffset.x;
  const playerY = -worldOffset.y;

  // ⚠️ CRITICAL: must stay perfectly in sync with CollisionSystem
  // same player position + same DECOR_CONFIG
  const trees = getTreesAround(playerX, playerY, DECOR_CONFIG);

  return (
    <div
      data-decor-layer
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {trees.map((tree) => {
        const spriteIndex = parseInt(tree.id.split("_")[0], 10) % TREE_ASSETS.length;
        const sprite = TREE_ASSETS[spriteIndex];
        return (
          <img
            key={tree.id}
            src={sprite}
            style={{
              position: "absolute",
              transform: `translate(${tree.x + worldOffset.x}px, ${tree.y + worldOffset.y}px) translateY(-100%)`,
              transformOrigin: "bottom center",
              imageRendering: "pixelated",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </div>
  );
}