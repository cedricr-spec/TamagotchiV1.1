import React from "react";
import { getItemSprite } from "../config/itemSpriteRegistry";

export default function Entity({ entity, x = 0, y = 0 }) {
  const type = entity?.type || "food";
  const spriteKey = entity?.spriteKey || "apple";
  const sprite = getItemSprite(type, spriteKey);

  if (!sprite) {
    // fallback (debug)
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 20,
          height: 20,
          background: "red",
          transform: `translate(${x}px, ${y}px) translate(-50%, -100%)`,
          zIndex: 10,
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: sprite.width,
        height: sprite.height,
        backgroundImage: `url(${sprite.sheet})`,
        backgroundPosition: `-${sprite.x}px -${sprite.y}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        transform: `translate(${x}px, ${y}px) translate(-50%, -100%)`,
        zIndex: 10,
      }}
    />
  );
}