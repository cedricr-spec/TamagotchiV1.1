import craftingAtlasPng from "../../spritesheets/items/Crafting Materials Icons.png"
import { getFoodDefinition, WORLD_FOODS } from "./worldFoodMetadata"

export const ITEM_TYPES = {
  MATERIAL: "material",
  TOOL: "tool",
  FOOD: "food",
  CARE: "care",
  RARE: "rare",
  STRUCTURE: "structure",
  CHARM: "charm",
  RESOURCE: "resource",
  CONTAINER: "container",
}

const CRAFTING_ATLAS = craftingAtlasPng

function atlasRect(x, y) {
  return { atlasSource: CRAFTING_ATLAS, atlasRect: { x, y, width: 16, height: 16 } }
}

function createItemDefinition({
  id,
  name,
  icon,
  spritePath = null,
  type,
  category = null,
  description,
  spriteKey = id,
  stackable = true,
  maxStack = 99,
  usable = false,
  equipable = false,
  reward = null,
  rewardAmount = 1,
  useEffects,
  legacyIds = [],
  atlasSource = null,
  atlasRect: atlasRectVal = null,
  food = null,
  discardable = null,
}) {
  const resolvedDiscardable =
    typeof discardable === "boolean"
      ? discardable
      : [ITEM_TYPES.FOOD, ITEM_TYPES.MATERIAL, ITEM_TYPES.RESOURCE, ITEM_TYPES.CARE].includes(type)

  return {
    id,
    name,
    icon,
    emoji: icon,
    spritePath,
    type,
    category,
    description,
    spriteKey,
    stackable,
    maxStack,
    usable,
    equipable,
    reward,
    rewardAmount,
    useEffects,
    legacyIds,
    atlasSource,
    atlasRect: atlasRectVal,
    food,
    discardable: resolvedDiscardable,
  }
}

const CORE_ITEM_DEFINITIONS = [
  createItemDefinition({
    id: "apple",
    name: "Apple",
    icon: "🍎",
    type: ITEM_TYPES.FOOD,
    category: "fruit",
    description: "A fresh apple that can be eaten or used in recipes.",
    reward: "inventory_item",
    usable: true,
    useEffects: { hunger: 6, health: 2 },
    legacyIds: ["fruits"],
  }),
  createItemDefinition({
    id: "water_drop",
    name: "Water Drop",
    icon: "💧",
    type: ITEM_TYPES.MATERIAL,
    category: "material",
    description: "A small drop of water gathered for simple cooking and charms.",
  }),
  createItemDefinition({
    id: "flower",
    name: "Flower",
    icon: "🌸",
    type: ITEM_TYPES.MATERIAL,
    category: "material",
    description: "A fragrant flower used in decorations and trinkets.",
  }),
  createItemDefinition({
    id: "mushroom",
    name: "Mushroom",
    icon: "🍄",
    type: ITEM_TYPES.MATERIAL,
    category: "material",
    description: "A soft woodland mushroom suited for soups and meals.",
  }),
  createItemDefinition({
    id: "berry",
    name: "Berry",
    icon: "🫐",
    type: ITEM_TYPES.FOOD,
    category: "fruit",
    description: "Sweet berries that pair well with fruit-based recipes.",
  }),
  createItemDefinition({
    id: "gem",
    name: "Gem",
    icon: "💎",
    type: ITEM_TYPES.RARE,
    category: "rare",
    description: "A rare gemstone with a polished shine.",
  }),
  createItemDefinition({
    id: "cake",
    name: "Cake",
    icon: "🍰",
    type: ITEM_TYPES.FOOD,
    category: "dessert",
    description: "A cheerful dessert for a quick happiness boost.",
    maxStack: 10,
    usable: true,
    useEffects: { hunger: 14, happiness: 6 },
  }),
  createItemDefinition({
    id: "care_kit",
    name: "Care Kit",
    icon: "🩹",
    type: ITEM_TYPES.CARE,
    category: "care",
    description: "A restorative bundle that helps your companion recover.",
    maxStack: 10,
    usable: true,
    useEffects: { health: 18, happiness: 2 },
  }),
  createItemDefinition({
    id: "campfire",
    name: "Campfire",
    icon: "🔥",
    type: ITEM_TYPES.STRUCTURE,
    category: "structure",
    description: "A simple campfire ready for a cozy setup.",
  }),
  createItemDefinition({
    id: "mushroom_soup",
    name: "Mushroom Soup",
    icon: "🍲",
    type: ITEM_TYPES.FOOD,
    category: "meal",
    description: "A warm bowl of mushroom soup.",
  }),
  createItemDefinition({
    id: "fruit_salad",
    name: "Fruit Salad",
    icon: "🥗",
    type: ITEM_TYPES.FOOD,
    category: "meal",
    description: "A colorful fruit salad mixed with fresh blossoms.",
  }),
  createItemDefinition({
    id: "flower_charm",
    name: "Flower Charm",
    icon: "🌼",
    type: ITEM_TYPES.CHARM,
    category: "charm",
    description: "A delicate charm infused with floral magic.",
  }),
  createItemDefinition({
    id: "stone_path",
    name: "Stone Path",
    icon: "🧱",
    type: ITEM_TYPES.STRUCTURE,
    category: "structure",
    description: "A fitted stone path segment for tidy landscaping.",
  }),
  createItemDefinition({
    id: "iron_frame",
    name: "Iron Frame",
    icon: "⚙️",
    type: ITEM_TYPES.STRUCTURE,
    category: "structure",
    description: "A reinforced frame assembled from gears and stone.",
  }),
  createItemDefinition({
    id: "lucky_gem",
    name: "Lucky Gem",
    icon: "💎",
    type: ITEM_TYPES.RARE,
    category: "rare",
    description: "A polished lucky gem with a faint, enchanted glow.",
  }),
  createItemDefinition({
    id: "wood",
    name: "Wood",
    icon: "🪵",
    type: ITEM_TYPES.RESOURCE,
    category: "resource",
    description: "Wood gathered from tree families.",
    reward: "inventory_item",
    maxStack: 64,
    ...atlasRect(432, 336),
  }),
  createItemDefinition({
    id: "gears",
    name: "Gears",
    icon: "⚙️",
    type: ITEM_TYPES.MATERIAL,
    category: "material",
    description: "Existing legacy iron/gears resource. Kept for compatibility.",
    reward: "inventory_item",
    maxStack: 64,
    legacyIds: ["metal", "iron"],
    ...atlasRect(432, 496),
  }),
  createItemDefinition({
    id: "stone",
    name: "Stone",
    icon: "🪨",
    type: ITEM_TYPES.RESOURCE,
    category: "resource",
    description: "Mined stone resource gathered from rock families.",
    maxStack: 64,
    ...atlasRect(432, 480),
  }),
  createItemDefinition({
    id: "axe",
    name: "Axe",
    icon: "🪓",
    type: ITEM_TYPES.TOOL,
    category: "tool",
    description: "Basic chopping tool for tree families.",
    stackable: false,
    maxStack: 1,
    equipable: true,
    usable: true,
    ...atlasRect(48, 528),
  }),
  createItemDefinition({
    id: "pickaxe",
    name: "Pickaxe",
    icon: "⛏️",
    type: ITEM_TYPES.TOOL,
    category: "tool",
    description: "Basic mining tool for rocks and ore.",
    stackable: false,
    maxStack: 1,
    equipable: true,
    usable: true,
    ...atlasRect(48, 512),
  }),
  createItemDefinition({
    id: "woodstick",
    name: "Stick",
    icon: "🪹",
    type: ITEM_TYPES.RESOURCE,
    category: "resource",
    description: "Wood stick crafted from wood. Used as a handle for basic tools.",
    maxStack: 64,
    ...atlasRect(480, 336),
  }),
  createItemDefinition({
    id: "wooden_bucket",
    name: "Wooden Bucket",
    icon: "🪣",
    type: ITEM_TYPES.CONTAINER,
    category: "container",
    description: "Basic bucket used for collecting liquids later.",
    stackable: false,
    maxStack: 1,
    usable: true,
    ...atlasRect(0, 384),
  }),
  createItemDefinition({
    id: "water_bucket",
    name: "Water Bucket",
    icon: "🪣",
    type: ITEM_TYPES.CONTAINER,
    category: "container",
    description: "Filled bucket variant obtained near water terrain.",
    stackable: false,
    maxStack: 1,
    usable: true,
    ...atlasRect(0, 400),
  }),
  createItemDefinition({
    id: "gem_nugget_xs",
    name: "Gem (XS)",
    icon: "💎",
    type: ITEM_TYPES.RESOURCE,
    category: "resource",
    description: "Tiny raw gem fragment mined from rocks.",
    maxStack: 32,
    ...atlasRect(432, 512),
  }),
  createItemDefinition({
    id: "gem_nugget_s",
    name: "Gem (S)",
    icon: "💎",
    type: ITEM_TYPES.RESOURCE,
    category: "resource",
    description: "Small gem nugget.",
    maxStack: 32,
    ...atlasRect(448, 512),
  }),
  createItemDefinition({
    id: "gem_nugget_m",
    name: "Gem (M)",
    icon: "💎",
    type: ITEM_TYPES.RESOURCE,
    category: "resource",
    description: "Medium gem nugget.",
    maxStack: 32,
    ...atlasRect(464, 512),
  }),
  createItemDefinition({
    id: "gem_nugget_l",
    name: "Gem (L)",
    icon: "💎",
    type: ITEM_TYPES.RESOURCE,
    category: "resource",
    description: "Large gem nugget.",
    maxStack: 32,
    ...atlasRect(480, 512),
  }),
  createItemDefinition({
    id: "rare_gem",
    name: "Rare Gem",
    icon: "💎",
    type: ITEM_TYPES.RARE,
    category: "rare",
    description: "A fully refined rare gem.",
    maxStack: 32,
    usable: true,
    ...atlasRect(496, 512),
  }),
  createItemDefinition({
    id: "iron_ingot",
    name: "Iron Ingot",
    icon: "🔩",
    type: ITEM_TYPES.MATERIAL,
    category: "material",
    description: "Refined crafting material for stronger tools.",
    maxStack: 64,
  }),
]

const CORE_ITEM_DEFINITION_MAP = CORE_ITEM_DEFINITIONS.reduce((registry, item) => {
  registry[item.id] = item
  return registry
}, {})

function createFoodItemDefinition(foodDefinition, existingDefinition = null) {
  return createItemDefinition({
    id: foodDefinition.id,
    name: foodDefinition.name || existingDefinition?.name || foodDefinition.id,
    icon: foodDefinition.icon || existingDefinition?.icon || "🍽️",
    spritePath: foodDefinition.spritePath || existingDefinition?.spritePath || null,
    type: ITEM_TYPES.FOOD,
    category: foodDefinition.category || existingDefinition?.category || "food",
    description: foodDefinition.description || existingDefinition?.description || "",
    spriteKey: existingDefinition?.spriteKey || foodDefinition.id,
    stackable: foodDefinition.stackable ?? existingDefinition?.stackable ?? true,
    maxStack: foodDefinition.maxStack ?? existingDefinition?.maxStack ?? 32,
    usable: existingDefinition?.usable ?? false,
    equipable: existingDefinition?.equipable ?? false,
    reward: existingDefinition?.reward ?? "inventory_item",
    rewardAmount:
      foodDefinition.obtain?.outputQuantity ??
      existingDefinition?.rewardAmount ??
      1,
    useEffects: existingDefinition?.useEffects,
    discardable: existingDefinition?.discardable ?? true,
    legacyIds: existingDefinition?.legacyIds || [],
    atlasSource: foodDefinition.atlasSource || existingDefinition?.atlasSource || null,
    atlasRect: foodDefinition.atlasRect || existingDefinition?.atlasRect || null,
    food: foodDefinition.food || existingDefinition?.food || null,
  })
}

const FOOD_ITEM_DEFINITIONS = Object.keys(WORLD_FOODS)
  .map((foodId) => getFoodDefinition(foodId))
  .filter((food) => food?.enabled)
  .map((food) => createFoodItemDefinition(food, CORE_ITEM_DEFINITION_MAP[food.id]))

const FOOD_ITEM_IDS = new Set(FOOD_ITEM_DEFINITIONS.map((item) => item.id))

const ITEM_DEFINITIONS = [
  ...CORE_ITEM_DEFINITIONS.filter((item) => !FOOD_ITEM_IDS.has(item.id)),
  ...FOOD_ITEM_DEFINITIONS,
]

export const ITEMS_REGISTRY = ITEM_DEFINITIONS.reduce((registry, item) => {
  registry[item.id] = item
  return registry
}, {})

export const ITEM_ALIASES = ITEM_DEFINITIONS.reduce((aliases, item) => {
  item.legacyIds.forEach((legacyId) => {
    aliases[legacyId] = item.id
  })
  return aliases
}, {})

export const RESOURCE_ITEM_IDS = ["gears"]

export function getCanonicalItemId(itemId) {
  if (!itemId) return null
  if (ITEMS_REGISTRY[itemId]) return itemId
  return ITEM_ALIASES[itemId] || null
}

export function getItemDefinition(itemId) {
  const canonicalItemId = getCanonicalItemId(itemId)
  return canonicalItemId ? ITEMS_REGISTRY[canonicalItemId] || null : null
}

export function getItemMaxStack(itemId) {
  return getItemDefinition(itemId)?.maxStack || 1
}

export function isItemStackable(itemId) {
  return Boolean(getItemDefinition(itemId)?.stackable)
}

export function isItemDiscardable(itemId) {
  return Boolean(getItemDefinition(itemId)?.discardable)
}
