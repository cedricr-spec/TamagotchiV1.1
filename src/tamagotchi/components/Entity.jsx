import React from "react";
import {
  getItemSprite,
  getItemWorldSprite,
} from "../config/itemSpriteRegistry";

const ENTITY_SCALE = 2;

export default function Entity({ entity, x = 0, y = 0 }) {
  const type = entity?.type || "food";
  const spriteKey = entity?.spriteKey || "apple";
  const sprite =
    (entity?.itemKey && getItemWorldSprite(entity.itemKey)) ||
    getItemSprite(type, spriteKey);

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
        width: sprite.width * ENTITY_SCALE,
        height: sprite.height * ENTITY_SCALE,
        ...(sprite.isDirectAsset
          ? {}
          : {
              backgroundImage: `url(${sprite.sheet})`,
              backgroundPosition: `-${sprite.x}px -${sprite.y}px`,
              backgroundRepeat: "no-repeat",
            }),
        imageRendering: "pixelated",
        transform: `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${ENTITY_SCALE})`,
        zIndex: 10,
      }}
    >
      {sprite.isDirectAsset && (
        <img
          src={sprite.sheet}
          alt=""
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain",
            imageRendering: "pixelated",
          }}
        />
      )}
    </div>
  );
}
