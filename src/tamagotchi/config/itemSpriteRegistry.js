// Central registry for item visuals and item-level gameplay metadata.
// This keeps world pickup sprites and menu icons aligned.

import foodSpritesheet from "../../spritesheets/items_spritesheet/foodspritesheet.webp";
import carrotIcon from "../../spritesheets/items_spritesheet/carrot.webp";
import carrotBagIcon from "../../spritesheets/items_spritesheet/carrotbag.webp";

const DEFAULT_ITEM_TYPE = "food";
const DEFAULT_ITEM_KEY = "apple";
const DEFAULT_SPRITE_SIZE = 16;

export const ITEM_SPRITE_REGISTRY = {
  food: {
    sheet: foodSpritesheet,
    tileWidth: 16,
    tileHeight: 16,

    items: {
      apple: { col: 0, row: 0 },
      meat: { col: 1, row: 0 },
      fish: { col: 2, row: 0 },
      berry: { col: 3, row: 0 },
      carrot: {
        src: carrotIcon,
        width: DEFAULT_SPRITE_SIZE,
        height: DEFAULT_SPRITE_SIZE,
      },
      carrotbag: {
        src: carrotBagIcon,
        width: DEFAULT_SPRITE_SIZE,
        height: DEFAULT_SPRITE_SIZE,
      },
      bread: { col: 5, row: 0 },
      cheese: { col: 6, row: 0 },
    },
  },
};

export const ITEM_REGISTRY = {
  carrot: {
    type: "food",
    menuSpriteKey: "carrot",
    worldSpriteKey: "carrotbag",
    reward: "carrot",
    rewardAmount: 1,
  },
};

function resolveSprite(category, spriteKey) {
  if (!category || !spriteKey) return null;

  const item = category.items?.[spriteKey];
  if (!item) return null;

  if (item.src) {
    return {
      sheet: item.src,
      width: item.width || category.tileWidth || DEFAULT_SPRITE_SIZE,
      height: item.height || category.tileHeight || DEFAULT_SPRITE_SIZE,
      x: 0,
      y: 0,
      isDirectAsset: true,
    };
  }

  const tileWidth = category.tileWidth || DEFAULT_SPRITE_SIZE;
  const tileHeight = category.tileHeight || DEFAULT_SPRITE_SIZE;

  return {
    sheet: item.sheet || category.sheet,
    width: tileWidth,
    height: tileHeight,
    x: (item.col || 0) * tileWidth,
    y: (item.row || 0) * tileHeight,
    isDirectAsset: false,
  };
}

export function getItemDefinition(itemKey) {
  return ITEM_REGISTRY[itemKey] || null;
}

export function getItemSprite(type, spriteKey) {
  const category =
    ITEM_SPRITE_REGISTRY[type] || ITEM_SPRITE_REGISTRY[DEFAULT_ITEM_TYPE];
  if (!category) return null;

  const safeKey =
    spriteKey && category.items?.[spriteKey] ? spriteKey : DEFAULT_ITEM_KEY;

  return resolveSprite(category, safeKey);
}

export function getItemMenuSprite(itemKey) {
  const item = getItemDefinition(itemKey);
  if (!item) return null;

  return getItemSprite(item.type, item.menuSpriteKey);
}

export function getItemWorldSprite(itemKey) {
  const item = getItemDefinition(itemKey);
  if (!item) return null;

  return getItemSprite(item.type, item.worldSpriteKey);
}
