import { getCanonicalItemId } from "./itemsRegistry"
import { WORLD_FOOD_RECIPES, resolveFoodAtlasUrl } from "./worldFoodMetadata"

const METADATA_RECIPES = [
  {
    id: "woodstick",
    name: "Stick",
    icon: "🪹",
    inputs: [{ itemId: "wood", quantity: 1 }],
    outputs: [{ itemId: "woodstick", quantity: 2 }],
    category: "resource",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "axe",
    name: "Axe",
    icon: "🪓",
    inputs: [
      { itemId: "woodstick", quantity: 2 },
      { itemId: "stone", quantity: 2 },
    ],
    outputs: [{ itemId: "axe", quantity: 1 }],
    category: "tools",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "pickaxe",
    name: "Pickaxe",
    icon: "⛏️",
    inputs: [
      { itemId: "woodstick", quantity: 2 },
      { itemId: "stone", quantity: 3 },
    ],
    outputs: [{ itemId: "pickaxe", quantity: 1 }],
    category: "tools",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "wooden_bucket",
    name: "Wooden Bucket",
    icon: "🪣",
    inputs: [{ itemId: "wood", quantity: 3 }],
    outputs: [{ itemId: "wooden_bucket", quantity: 1 }],
    category: "tools",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "iron_ingot",
    name: "Iron Ingot",
    icon: "🔩",
    inputs: [{ itemId: "gears", quantity: 2 }],
    outputs: [{ itemId: "iron_ingot", quantity: 1 }],
    category: "material",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "gem_nugget_s",
    name: "Gem (S)",
    icon: "💎",
    inputs: [{ itemId: "gem_nugget_xs", quantity: 2 }],
    outputs: [{ itemId: "gem_nugget_s", quantity: 1 }],
    category: "resource",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "gem_nugget_m",
    name: "Gem (M)",
    icon: "💎",
    inputs: [{ itemId: "gem_nugget_s", quantity: 2 }],
    outputs: [{ itemId: "gem_nugget_m", quantity: 1 }],
    category: "resource",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "gem_nugget_l",
    name: "Gem (L)",
    icon: "💎",
    inputs: [{ itemId: "gem_nugget_m", quantity: 2 }],
    outputs: [{ itemId: "gem_nugget_l", quantity: 1 }],
    category: "resource",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "rare_gem",
    name: "Rare Gem",
    icon: "💎",
    inputs: [{ itemId: "gem_nugget_l", quantity: 2 }],
    outputs: [{ itemId: "rare_gem", quantity: 1 }],
    category: "resource",
    unlocked: true,
    showInPanel: true,
  },
]

const LEGACY_RECIPES = [
  {
    id: "care_kit",
    name: "Care Kit",
    icon: "🩹",
    spritePath: null,
    inputs: [
      { itemId: "wood", quantity: 1 },
      { itemId: "apple", quantity: 1 },
    ],
    outputs: [{ itemId: "care_kit", quantity: 1 }],
    category: "care",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "campfire",
    name: "Campfire",
    icon: "🔥",
    spritePath: null,
    inputs: [
      { itemId: "wood", quantity: 3 },
      { itemId: "stone", quantity: 2 },
    ],
    outputs: [{ itemId: "campfire", quantity: 1 }],
    category: "structures",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "flower_charm",
    name: "Flower Charm",
    icon: "🌼",
    spritePath: null,
    inputs: [
      { itemId: "flower", quantity: 3 },
      { itemId: "gem", quantity: 1 },
    ],
    outputs: [{ itemId: "flower_charm", quantity: 1 }],
    category: "charms",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "stone_path",
    name: "Stone Path",
    icon: "🧱",
    spritePath: null,
    inputs: [{ itemId: "stone", quantity: 4 }],
    outputs: [{ itemId: "stone_path", quantity: 1 }],
    category: "structures",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "iron_frame",
    name: "Iron Frame",
    icon: "⚙️",
    spritePath: null,
    inputs: [
      { itemId: "gears", quantity: 3 },
      { itemId: "stone", quantity: 2 },
    ],
    outputs: [{ itemId: "iron_frame", quantity: 1 }],
    category: "structures",
    unlocked: true,
    showInPanel: true,
  },
  {
    id: "lucky_gem",
    name: "Lucky Gem",
    icon: "💎",
    spritePath: null,
    inputs: [
      { itemId: "gem", quantity: 1 },
      { itemId: "flower", quantity: 2 },
      { itemId: "water_drop", quantity: 1 },
    ],
    outputs: [{ itemId: "lucky_gem", quantity: 1 }],
    category: "charms",
    unlocked: true,
    showInPanel: true,
  },
]

const FOOD_METADATA_RECIPES = Object.values(WORLD_FOOD_RECIPES).map((recipe) => ({
  ...recipe,
  spritePath: recipe.spritePath?.trim() || null,
  atlasSource: resolveFoodAtlasUrl(recipe.atlasSource),
  atlasRect: recipe.atlasRect || null,
  category: recipe.category || "food",
  unlocked: recipe.unlocked !== false,
  showInPanel: true,
}))

function dedupeRecipesById(recipes) {
  const recipeMap = new Map()
  recipes.forEach((recipe) => {
    recipeMap.set(recipe.id, recipe)
  })
  return [...recipeMap.values()]
}

const RAW_CRAFT_RECIPES = dedupeRecipesById([
  ...METADATA_RECIPES,
  ...LEGACY_RECIPES,
  ...FOOD_METADATA_RECIPES,
])

function normalizeRecipeItems(items = []) {
  return items
    .map((entry) => {
      const itemId = getCanonicalItemId(entry?.itemId) || entry?.itemId
      const quantity = Math.max(0, Number(entry?.quantity) || 0)
      if (!itemId || quantity <= 0) return null
      return { itemId, quantity }
    })
    .filter(Boolean)
}

function normalizeIngredients(ingredients = {}) {
  return normalizeRecipeItems(
    Object.entries(ingredients).map(([itemId, quantity]) => ({ itemId, quantity }))
  )
}

function normalizeRecipe(recipe) {
  return {
    ...recipe,
    spritePath: recipe.spritePath ?? null,
    atlasSource: recipe.atlasSource ?? null,
    atlasRect: recipe.atlasRect ?? null,
    inputs: normalizeRecipeItems(recipe.inputs || normalizeIngredients(recipe.ingredients)),
    outputs: normalizeRecipeItems(recipe.outputs || (recipe.output ? [recipe.output] : [])),
    unlocked: recipe.unlocked !== false,
  }
}

export const CRAFT_RECIPES = RAW_CRAFT_RECIPES.map(normalizeRecipe)

export function getCraftRecipe(recipeId) {
  return CRAFT_RECIPES.find((recipe) => recipe.id === recipeId) || null
}

export function getVisibleCraftRecipes() {
  return CRAFT_RECIPES.filter(
    (recipe) => recipe.showInPanel !== false && recipe.unlocked !== false
  )
}

export function getRecipeInputs(recipe) {
  return recipe?.inputs || []
}

export function getRecipeOutputs(recipe) {
  return recipe?.outputs || []
}

export function getRecipePrimaryOutput(recipe) {
  return getRecipeOutputs(recipe)[0] || null
}

export function countItemsInSlots(slots = []) {
  return slots.reduce((counts, slot) => {
    const itemId = getCanonicalItemId(slot?.itemId) || slot?.itemId
    const quantity = Math.max(0, Number(slot?.quantity) || 0)
    if (!itemId || quantity <= 0) return counts
    counts[itemId] = (counts[itemId] || 0) + quantity
    return counts
  }, {})
}

export function getRecipeAvailability(recipe, itemCounts = {}) {
  const inputs = getRecipeInputs(recipe).map((input) => {
    const owned = Math.max(0, Number(itemCounts[input.itemId]) || 0)
    return {
      ...input,
      owned,
      missing: Math.max(0, input.quantity - owned),
      fulfilled: owned >= input.quantity,
    }
  })

  return {
    inputs,
    canCraft: inputs.every((input) => input.fulfilled),
  }
}

export function resolveCraftRecipe(craftSlots = []) {
  const counts = countItemsInSlots(craftSlots)
  const presentItemIds = Object.keys(counts).filter((itemId) => counts[itemId] > 0)

  return (
    CRAFT_RECIPES.find((recipe) => {
      const ingredientIds = getRecipeInputs(recipe).map((input) => input.itemId)
      if (presentItemIds.some((itemId) => !ingredientIds.includes(itemId))) return false
      return getRecipeInputs(recipe).every(
        (input) => (counts[input.itemId] || 0) >= input.quantity
      )
    }) || null
  )
}
