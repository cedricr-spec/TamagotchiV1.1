// Central registry for all item spritesheets
// Scalable: supports multiple categories (food, tools, etc.)

import foodSpritesheet from "../../spritesheets/items_spritesheet/foodspritesheet.webp";

export const ITEM_SPRITE_REGISTRY = {
  food: {
    sheet: foodSpritesheet,
    tileWidth: 16,
    tileHeight: 16,

    // grid-based system (col / row in spritesheet)
    items: {
      apple: { col: 0, row: 0 },
      meat: { col: 1, row: 0 },
      fish: { col: 2, row: 0 },
      berry: { col: 3, row: 0 },
      carrot: { col: 4, row: 0 },
      bread: { col: 5, row: 0 },
      cheese: { col: 6, row: 0 },
    },
  },
};

// Helper to resolve sprite data
export function getItemSprite(type, spriteKey) {
  const category = ITEM_SPRITE_REGISTRY[type];
  if (!category) return null;

  const item = category.items[spriteKey];
  if (!item) return null;

  const { col, row } = item;
  const { tileWidth, tileHeight, sheet } = category;

  return {
    sheet,
    width: tileWidth,
    height: tileHeight,
    x: col * tileWidth,
    y: row * tileHeight,
  };
}
