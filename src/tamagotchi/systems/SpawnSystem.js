import { useEffect } from "react"
import { useEntityStore } from "../store/entitySlice"
import { useWorldStore } from "../store/worldSlice"
import { MAX_ENTITIES } from "../config/spawnConfig"
import { ENTITY_TYPES } from "../config/entityTypes"
import { getCanonicalItemId } from "../config/itemsRegistry"
import { getSpawnableItemIds } from "../config/worldItemMetadata"
import { getSpawnableFoods, isFood } from "../config/worldFoodMetadata"

const INITIAL_PICKUP_COUNT = 3
const ACTIVE_PICKUP_LIMIT = Math.min(MAX_ENTITIES, 12)
const RESPAWN_INTERVAL_MS = 32000
const EXTRA_RESPAWN_CHANCE = 0.08

// Guaranteed starter pickups — 3 wood + 3 stone, spawned once per session.
const STARTER_RESOURCES = [
  { itemId: "wood",  angle: 0,                   radius: 100 },
  { itemId: "wood",  angle: (Math.PI * 2) / 3,   radius: 120 },
  { itemId: "wood",  angle: (Math.PI * 4) / 3,   radius: 110 },
  { itemId: "stone", angle: Math.PI / 3,          radius: 100 },
  { itemId: "stone", angle: Math.PI,              radius: 130 },
  { itemId: "stone", angle: (Math.PI * 5) / 3,   radius: 115 },
]
let starterResourcesSeeded = false

const PICKUP_SPAWN_CATEGORIES = Object.freeze({
  materials: {
    weight: 85,
    itemWeights: Object.freeze({
      wood: 50,
      stone: 30,
      // Keep woodstick out of the direct ground pool so the stick quest still revolves around crafting.
    }),
  },
  tools: {
    weight: 0,
    itemWeights: Object.freeze({}),
  },
  food_raw: {
    weight: 0,
    itemWeights: Object.freeze({}),
  },
  food_prepared: {
    weight: 0,
    itemWeights: Object.freeze({}),
  },
  rare: {
    weight: 0.25,
    itemWeights: Object.freeze({}),
  },
})

const SPAWNABLE_ITEM_ID_SET = new Set(getSpawnableItemIds())
const SPAWNABLE_FOOD_ID_SET = new Set(getSpawnableFoods().map((food) => food.id))

function pickWeightedEntry(entries, getWeight = (entry) => entry.weight) {
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, Number(getWeight(entry)) || 0), 0)
  if (totalWeight <= 0) return null

  let roll = Math.random() * totalWeight

  for (const entry of entries) {
    roll -= Math.max(0, Number(getWeight(entry)) || 0)
    if (roll <= 0) return entry
  }

  return entries[entries.length - 1] || null
}

function buildCategoryEntries(itemWeights = {}, allowedItemIds = new Set()) {
  return Object.entries(itemWeights)
    .filter(([itemId, weight]) => allowedItemIds.has(itemId) && weight > 0)
    .map(([itemId, weight]) => ({
      itemId,
      weight,
    }))
}

const SPAWN_CATEGORY_ENTRIES = [
  {
    id: "materials",
    weight: PICKUP_SPAWN_CATEGORIES.materials.weight,
    entries: buildCategoryEntries(
      PICKUP_SPAWN_CATEGORIES.materials.itemWeights,
      SPAWNABLE_ITEM_ID_SET
    ),
  },
  {
    id: "tools",
    weight: PICKUP_SPAWN_CATEGORIES.tools.weight,
    entries: buildCategoryEntries(PICKUP_SPAWN_CATEGORIES.tools.itemWeights, SPAWNABLE_ITEM_ID_SET),
  },
  {
    id: "food_raw",
    weight: PICKUP_SPAWN_CATEGORIES.food_raw.weight,
    entries: buildCategoryEntries(
      PICKUP_SPAWN_CATEGORIES.food_raw.itemWeights,
      SPAWNABLE_FOOD_ID_SET
    ),
  },
  {
    id: "food_prepared",
    weight: PICKUP_SPAWN_CATEGORIES.food_prepared.weight,
    entries: buildCategoryEntries(
      PICKUP_SPAWN_CATEGORIES.food_prepared.itemWeights,
      SPAWNABLE_FOOD_ID_SET
    ),
  },
  {
    id: "rare",
    weight: PICKUP_SPAWN_CATEGORIES.rare.weight,
    entries: buildCategoryEntries(PICKUP_SPAWN_CATEGORIES.rare.itemWeights, SPAWNABLE_ITEM_ID_SET),
  },
].filter((category) => category.weight > 0 && category.entries.length > 0)

const SPAWN_POOL_ITEM_IDS = [
  ...new Set(SPAWN_CATEGORY_ENTRIES.flatMap((category) => category.entries.map((entry) => entry.itemId))),
]

function getPickupEntityType(itemId) {
  return isFood(itemId) ? ENTITY_TYPES.FOOD : ENTITY_TYPES.RESOURCE
}

function getRandomSpawnPoolItemId() {
  const category = pickWeightedEntry(SPAWN_CATEGORY_ENTRIES, (entry) => entry.weight)
  if (!category) return null

  const itemEntry = pickWeightedEntry(category.entries)
  return itemEntry?.itemId || null
}

export default function SpawnSystem() {
  const spawnEntity = useEntityStore((s) => s.spawnEntity)

  const spawnPickupAround = (centerX, centerY, minRadius, maxRadius, itemId) => {
    if (!itemId) return

    const angle = Math.random() * Math.PI * 2
    const radius = minRadius + Math.random() * (maxRadius - minRadius)
    const jitterX = (Math.random() - 0.5) * 100
    const jitterY = (Math.random() - 0.5) * 100

    const x = centerX + Math.cos(angle) * radius + jitterX
    const y = centerY + Math.sin(angle) * radius + jitterY

    spawnEntity(x, y, getPickupEntityType(itemId), {
      itemKey: itemId,
      reward: "inventory_item",
      rewardAmount: 1,
    })
  }

  useEffect(() => {
    useEntityStore.setState((state) => ({
      entities: (state.entities || []).filter((entity) => {
        const canonicalItemId = getCanonicalItemId(entity.itemKey) || entity.itemKey
        return (
          (entity.type === ENTITY_TYPES.RESOURCE || entity.type === ENTITY_TYPES.FOOD) &&
          SPAWN_POOL_ITEM_IDS.includes(canonicalItemId)
        )
      }),
    }))

    const { worldOffset } = useWorldStore.getState()
    const centerX = -(worldOffset.x || 0)
    const centerY = -(worldOffset.y || 0)

    for (let index = 0; index < INITIAL_PICKUP_COUNT; index += 1) {
      const itemId = getRandomSpawnPoolItemId()
      spawnPickupAround(centerX, centerY, 140 + index * 45, 320 + index * 70, itemId)
    }

    if (!starterResourcesSeeded) {
      starterResourcesSeeded = true
      STARTER_RESOURCES.forEach(({ itemId, angle, radius }) => {
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        spawnEntity(x, y, ENTITY_TYPES.RESOURCE, {
          itemKey: itemId,
          reward: "inventory_item",
          rewardAmount: 1,
        })
      })
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const existing = useEntityStore.getState().entities
      const activePickups = existing.filter(
        (entity) => entity.type === ENTITY_TYPES.RESOURCE || entity.type === ENTITY_TYPES.FOOD
      ).length
      if (activePickups >= ACTIVE_PICKUP_LIMIT) return

      const { worldOffset } = useWorldStore.getState()

      const remainingCapacity = ACTIVE_PICKUP_LIMIT - activePickups
      if (remainingCapacity <= 0) return

      const desiredBatch = Math.random() < EXTRA_RESPAWN_CHANCE ? 2 : 1
      const batch = Math.min(remainingCapacity, desiredBatch)
      const minRadius = 200
      const maxRadius = 1200

      for (let i = 0; i < batch; i += 1) {
        const centerX = -(worldOffset.x || 0)
        const centerY = -(worldOffset.y || 0)
        const itemId = getRandomSpawnPoolItemId()
        spawnPickupAround(centerX, centerY, minRadius, maxRadius, itemId)
      }
    }, RESPAWN_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  return null
}
