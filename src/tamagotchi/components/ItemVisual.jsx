import React from "react"
import { getItemSpriteAsset } from "../config/itemSprites"
import { getItemDefinition } from "../config/itemsRegistry"

function renderAtlasSprite(atlasSource, atlasRectVal, size) {
  const tileSize = atlasRectVal.width || 16
  const scale = size / tileSize

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        position: "relative",
        display: "inline-block",
        imageRendering: "pixelated",
        flexShrink: 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: tileSize,
          height: atlasRectVal.height || tileSize,
          backgroundImage: `url(${atlasSource})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `-${atlasRectVal.x}px -${atlasRectVal.y}px`,
          backgroundSize: "auto",
          imageRendering: "pixelated",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  )
}

function renderSprite(sprite, size) {
  if (!sprite) return null

  if (sprite.src) {
    return (
      <img
        src={sprite.src}
        alt=""
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          imageRendering: "pixelated",
          pointerEvents: "none",
        }}
      />
    )
  }

  if (sprite.sheet) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${sprite.sheet})`,
          backgroundPosition: `-${sprite.x || 0}px -${sprite.y || 0}px`,
          backgroundRepeat: "no-repeat",
          backgroundSize: sprite.backgroundSize || "auto",
          imageRendering: "pixelated",
          pointerEvents: "none",
        }}
      />
    )
  }

  return null
}

export default function ItemVisual({
  itemId,
  variant = "inventory",
  size = 24,
  emojiSize = 22,
}) {
  const item = getItemDefinition(itemId)

  // Priority 1: atlas sprite (atlasSource + atlasRect from item definition)
  if (item?.atlasSource && item?.atlasRect) {
    return renderAtlasSprite(item.atlasSource, item.atlasRect, size)
  }

  // Priority 2: configured sprite asset or spritePath
  const sprite = getItemSpriteAsset(itemId, variant)
  const spriteNode = renderSprite(sprite, size)
  if (spriteNode) return spriteNode

  // Priority 3: emoji / placeholder fallback
  return (
    <span
      aria-hidden="true"
      style={{
        fontSize: `${emojiSize}px`,
        lineHeight: 1,
        display: "block",
        transform: variant === "world" ? "translateY(-1px)" : "none",
        pointerEvents: "none",
      }}
    >
      {item?.icon || item?.emoji || "❔"}
    </span>
  )
}
