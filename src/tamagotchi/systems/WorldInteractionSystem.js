import { useEffect } from "react"
import { useWorldStore } from "../store/worldSlice"
import { useBrokenObjectsStore } from "../store/brokenObjectsStore"
import { useInventoryStore } from "../store/useInventoryStore"
import { useEntityStore } from "../store/entitySlice"
import { useQuestStore } from "../store/useQuestStore"
import { useWorldFxStore } from "../store/worldFxStore"
import { getItemDefinition } from "../config/itemsRegistry"
import { ENTITY_TYPES } from "../config/entityTypes"
import { getWorldThemeConfig } from "../config/worldThemeConfig"
import {
  WORLD_ATLAS_DATA,
  applyWorldAtlasObjectState,
  createWorldAtlasStumpObject,
  getWorldAtlasEntryById,
} from "../utils/worldAtlasData"
import {
  WORLD_ATLAS_COLLISION_VIEWPORT,
  getWorldAtlasCollisionBounds,
  getWorldAtlasLayout,
} from "../utils/worldAtlasFamilies"

const SLOT_KEYS = ["a", "z", "e", "r", "t"]
const INTERACTION_RADIUS = 128
const OBJECT_IMPACT_DURATION_MS = 140

const TOOL_CONFIG = {
  pickaxe: {
    targetGroup: "rocks",
    spawnItemId: "stone",
    successMessage: "Mined!",
    missingMessage: "No rock nearby",
    interactionType: "mine_object",
  },
  axe: {
    targetGroup: "trees",
    spawnItemId: "wood",
    successMessage: "Chopped!",
    missingMessage: "No tree nearby",
    interactionType: "chop_object",
  },
}

const INTERACTION_FX_CONFIG = {
  axe: {
    type: "axe_slash",
    towardPetDistance: 18,
    liftFromBase: 18,
  },
  pickaxe: {
    type: "pickaxe_slash",
    towardPetDistance: 12,
    liftFromBase: 26,
  },
}

function isTreeItem(item) {
  const group = item.entry?.group
  const family = item.entry?.family || item.worldDecorFamily || ""
  const name = String(item.entry?.name || item.id || "").toLowerCase()
  const tags = item.entry?.tags || []
  return (
    group === "trees" ||
    family.includes("tree") ||
    name.includes("tree") ||
    tags.includes("tree")
  )
}

function isRockItem(item) {
  const group = item.entry?.group
  const family = item.entry?.family || item.worldDecorFamily || ""
  const name = String(item.entry?.name || item.id || "").toLowerCase()
  const tags = item.entry?.tags || []
  return (
    group === "rocks" ||
    family.includes("rock") ||
    name.includes("rock") ||
    tags.includes("rock")
  )
}

function matchesTargetGroup(item, targetGroup) {
  if (targetGroup === "trees") return isTreeItem(item)
  if (targetGroup === "rocks") return isRockItem(item)
  return false
}

function isInteractionDisabledItem(item) {
  return item?.entry?.interactionDisabled === true
}

function isTreeInteractionBlocked(item) {
  return isInteractionDisabledItem(item) || item?.entry?.isStump === true
}

// Use base position (anchor point) as the primary distance reference.
// Falls back to collision bounds center when base is unavailable.
function getItemDistancePoint(item) {
  if (item.baseX != null && item.baseY != null) {
    return { x: item.baseX, y: item.baseY }
  }
  if (item.x != null && item.y != null) {
    return { x: item.x, y: item.y }
  }
  try {
    const bounds = getWorldAtlasCollisionBounds(item)
    return {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
    }
  } catch {
    return null
  }
}

function getInteractionFxPoint(item) {
  if (item.baseX != null && item.baseY != null) {
    return { x: item.baseX, y: item.baseY }
  }

  try {
    const bounds = getWorldAtlasCollisionBounds(item)
    return {
      x: (bounds.left + bounds.right) / 2,
      y: bounds.bottom,
    }
  } catch {
    if (item.x != null && item.y != null) {
      return { x: item.x, y: item.y }
    }
  }

  return null
}

function createInteractionFx(toolId, petX, petY, target) {
  const fxConfig = INTERACTION_FX_CONFIG[toolId]
  if (!fxConfig) return null

  const targetPoint = getInteractionFxPoint(target)
  if (!targetPoint) return null

  const towardPetX = petX - targetPoint.x
  const towardPetY = petY - targetPoint.y
  const distance = Math.hypot(towardPetX, towardPetY) || 1
  const unitX = towardPetX / distance
  const unitY = towardPetY / distance

  return {
    type: fxConfig.type,
    x: targetPoint.x + unitX * fxConfig.towardPetDistance,
    y: targetPoint.y + unitY * fxConfig.towardPetDistance - fxConfig.liftFromBase,
    flipX: targetPoint.x < petX,
  }
}

export default function WorldInteractionSystem() {
  useEffect(() => {
    const pendingResultObjectIds = new Set()
    const pendingResultTimeouts = new Set()

    function handleKeyDown(event) {
      if (event.repeat) return

      const key = event.key.toLowerCase()
      const slotIndex = SLOT_KEYS.indexOf(key)
      if (slotIndex === -1) return

      const inventoryState = useInventoryStore.getState()
      const slot = inventoryState.usableSlots[slotIndex]
      if (!slot?.itemId) return

      const definition = getItemDefinition(slot.itemId)
      if (!definition?.equipable) return

      const toolConfig = TOOL_CONFIG[slot.itemId]
      if (!toolConfig) return

      const { worldOffset, currentWorldTheme } = useWorldStore.getState()
      const petX = -(worldOffset?.x || 0)
      const petY = -(worldOffset?.y || 0)

      const theme = getWorldThemeConfig(currentWorldTheme)
      const layout = getWorldAtlasLayout(
        petX,
        petY,
        theme.atlasData,
        WORLD_ATLAS_COLLISION_VIEWPORT
      )

      const brokenStore = useBrokenObjectsStore.getState()

      // renderItems only contains floating/object-anchored items (trees, etc.).
      // Tile-anchored items (small rocks) live in tileChunks — extract those
      // that have explicit interaction metadata so we can mine them too.
      const tileInteractionItems = layout.tileChunks.flatMap((chunk) => [
        ...chunk.tileBackItems,
        ...chunk.tileFrontItems,
      ]).filter((item) => item.entry?.interaction != null)

      const allRenderItems = applyWorldAtlasObjectState(
        [...layout.renderItems, ...tileInteractionItems],
        theme.atlasData,
        brokenStore
      )

      const candidates = allRenderItems.filter((item) => {
        if (isInteractionDisabledItem(item)) return false
        if (slot.itemId === "axe" && isTreeInteractionBlocked(item)) return false

        const interaction = item.entry?.interaction
        // Primary: explicit interaction metadata from world-tile-metadata.json
        if (interaction) {
          if (interaction.type !== "mine" && interaction.type !== "chop") return false
          if (interaction.tool !== slot.itemId) return false
        } else {
          // Fallback: name/group/family heuristics for legacy objects without metadata
          if (!matchesTargetGroup(item, toolConfig.targetGroup)) return false
        }
        const pt = getItemDistancePoint(item)
        if (!pt) return false
        return Math.hypot(pt.x - petX, pt.y - petY) <= INTERACTION_RADIUS
      })

      if (candidates.length === 0) {
        brokenStore.showWorldFeedback(toolConfig.missingMessage)
        return
      }

      // Pick closest by base position distance
      const target = candidates.reduce((closest, item) => {
        const pt = getItemDistancePoint(item)
        const closestPt = getItemDistancePoint(closest)
        if (!pt) return closest
        if (!closestPt) return item
        return Math.hypot(pt.x - petX, pt.y - petY) < Math.hypot(closestPt.x - petX, closestPt.y - petY)
          ? item
          : closest
      })

      const spawnItemId = target.entry?.interaction?.gives || toolConfig.spawnItemId
      const replacementEntryId =
        target.entry?.choppedVariantId ||
        target.entry?.interaction?.replacementEntryId ||
        null

      if (import.meta.env.DEV) {
        console.log("[interaction-target]", {
          slotItemId: slot.itemId,
          targetId: target.id,
          targetEntryId: target.entry?.id || null,
          targetEntryName: target.entry?.name || null,
          targetGroup: target.entry?.group || null,
          targetFamily: target.entry?.family || target.worldDecorFamily || null,
          interaction: target.entry?.interaction || null,
          choppedVariantId: target.entry?.choppedVariantId || null,
          replacementEntryId,
          baseX: target.baseX ?? null,
          baseY: target.baseY ?? null,
          x: target.x ?? null,
          y: target.y ?? null,
          scale: target.scale ?? null,
          anchorMode: target.anchorMode || null,
        })
      }

      if (pendingResultObjectIds.has(target.id)) return
      pendingResultObjectIds.add(target.id)

      const interactionFx = createInteractionFx(slot.itemId, petX, petY, target)
      if (interactionFx) {
        useWorldFxStore.getState().spawnFx(interactionFx)
      }

      useWorldFxStore.getState().spawnObjectImpact({
        objectId: target.id,
        item: target,
        durationMs: OBJECT_IMPACT_DURATION_MS,
      })

      const applyInteractionResult = () => {
        pendingResultObjectIds.delete(target.id)

        if (slot.itemId === "axe" && replacementEntryId) {
          const replacementEntry =
            getWorldAtlasEntryById(theme.atlasData, replacementEntryId) ||
            getWorldAtlasEntryById(WORLD_ATLAS_DATA, replacementEntryId)
          const stumpObject = createWorldAtlasStumpObject(target, replacementEntry)

          if (import.meta.env.DEV) {
            console.log("[chop-start]", {
              targetId: target.id,
              entryId: target.entry?.id || null,
              entryName: target.entry?.name || null,
              choppedVariantId: target.entry?.choppedVariantId || null,
              replacementEntryId,
              replacementEntryFound: Boolean(replacementEntry),
              replacementEntryName: replacementEntry?.name || null,
              baseX: target.baseX ?? null,
              baseY: target.baseY ?? null,
              x: target.x ?? null,
              y: target.y ?? null,
              scale: target.scale ?? null,
              anchorMode: target.anchorMode || null,
            })
            console.log("[stump-created]", {
              created: Boolean(stumpObject),
              originalId: target.id,
              stumpId: stumpObject?.id || null,
              replacementEntryId,
              stumpObject,
            })
          }

          if (stumpObject) {
            brokenStore.replaceObject({
              originalObjectId: target.id,
              stumpObject,
            })
          } else {
            if (import.meta.env.DEV) {
              console.log("[NO-STUMP-FALLBACK]", {
                reason: replacementEntry ? "createWorldAtlasStumpObject returned null" : "replacement entry not found",
                targetId: target.id,
                replacementEntryId,
                targetEntry: target.entry || null,
              })
            }
            brokenStore.breakObject(target.id)
          }
        } else {
          if (import.meta.env.DEV && slot.itemId === "axe") {
            console.log("[NO-STUMP-FALLBACK]", {
              reason: "missing replacementEntryId",
              targetId: target.id,
              targetEntry: target.entry || null,
            })
          }
          brokenStore.breakObject(target.id)
        }

        useEntityStore.getState().spawnEntity(
          target.baseX ?? target.x,
          target.baseY ?? target.y,
          ENTITY_TYPES.RESOURCE,
          { itemKey: spawnItemId, reward: "inventory_item", rewardAmount: 1 }
        )

        useQuestStore.getState().recordWorldInteraction({
          type: toolConfig.interactionType,
          sourceFamily: toolConfig.targetGroup,
          itemId: spawnItemId,
        })

        brokenStore.showWorldFeedback(toolConfig.successMessage)
      }

      const timeoutId = window.setTimeout(() => {
        pendingResultTimeouts.delete(timeoutId)
        applyInteractionResult()
      }, OBJECT_IMPACT_DURATION_MS)
      pendingResultTimeouts.add(timeoutId)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      pendingResultTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  return null
}
