import metadata from "../../spritesheets/world/world-item-metadata-clean-v2.json"
import craftingAtlasPng from "../../spritesheets/items/Crafting Materials Icons.png"

export const WORLD_ITEM_METADATA = metadata
export const WORLD_ITEMS = metadata.items
export const WORLD_RECIPES = metadata.recipes

// Map atlas filename keys to Vite-resolved asset URLs
export const ATLAS_URLS = {
  "Crafting Materials Icons.png": craftingAtlasPng,
}

export function resolveAtlasUrl(atlasSourcePath) {
  if (!atlasSourcePath) return null
  const filename = atlasSourcePath.split("/").pop()
  return ATLAS_URLS[filename] || atlasSourcePath
}

export function getWorldItemDef(itemId) {
  return WORLD_ITEMS[itemId] || null
}

export function getWorldRecipeDef(recipeId) {
  return WORLD_RECIPES[recipeId] || null
}

export function getSpawnableItemIds() {
  return Object.values(WORLD_ITEMS)
    .filter((item) => {
      // Force early game spawnables
      if (item.id === "wood" || item.id === "stone") return true
      // Disable gears completely
      if (item.id === "gears") return false
      return item.enabled && item.spawnable === true
    })
    .map((item) => item.id)
}

// Stubs prepared for future world interactions — not yet active
export const WORLD_INTERACTION_STUBS = {
  mine: { enabled: false, targetFamilies: ["rocks"], requiredTool: "pickaxe" },
  chop: { enabled: false, targetFamilies: ["trees"], requiredTool: "axe" },
  fill: { enabled: false, nearTerrain: "water", requiredTool: "wooden_bucket" },
}
