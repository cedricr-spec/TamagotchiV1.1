import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getItemDefinition } from "../config/itemsRegistry"
import InventorySlot from "./InventorySlot"
import ItemVisual from "./ItemVisual"
import RecipePanel from "./RecipePanel"
import {
  getUnlockedSlotCountForArea,
  INVENTORY_MAIN_SLOT_COUNT,
  INVENTORY_MAX_VISUAL_CAPACITY,
  isInventorySlotUnlocked,
  useInventoryStore,
} from "../store/useInventoryStore"
import { usePetStore } from "../store/usePetstore"
import { useQuestStore } from "../store/useQuestStore"

const OVERLAY_Z_INDEX = 1000002
const POPIN_Z_INDEX = 1000003
const CLICK_DRAG_THRESHOLD_PX = 5
const ACTION_FEEDBACK_DURATION_MS = 1800
const STORAGE_SLOT_STYLE = {
  position: "relative",
  width: "44px",
  height: "44px",
}

function parseSlotKey(slotKey) {
  if (!slotKey) return null
  const [area, rawIndex] = slotKey.split(":")
  const index = Number(rawIndex)
  if (Number.isNaN(index)) return null

  return { area, index }
}

function getObjectiveLabel(output) {
  if (!output?.itemId) return "Unknown Item"

  const itemDefinition = getItemDefinition(output.itemId)
  return `${itemDefinition?.name || output.itemId} x${Math.max(0, Number(output.quantity) || 0)}`
}

function hasAnyEffectValue(effects = {}) {
  return ["hunger", "energy", "happiness", "health"].some(
    (key) => Number(effects?.[key] || 0) !== 0
  )
}

function getFoodUseEffects(foodStats = null) {
  if (!foodStats?.edible) return null

  return {
    hunger: Number(foodStats.hungerRestore) || 0,
    energy: Number(foodStats.energyRestore) || 0,
    happiness: Number(foodStats.happinessRestore) || 0,
    health: Number(foodStats.healthRestore) || 0,
  }
}

function canUseItemDefinition(itemDefinition) {
  return Boolean(itemDefinition?.usable || itemDefinition?.food?.edible)
}

function renderLockedOverlay() {
  return (
    <span
      style={{
        position: "absolute",
        inset: "auto 3px 3px 3px",
        padding: "2px 0",
        borderRadius: "4px",
        background: "rgba(0,0,0,0.55)",
        fontSize: "8px",
        lineHeight: 1,
        color: "rgba(255,255,255,0.72)",
        textTransform: "uppercase",
        pointerEvents: "none",
      }}
    >
      Locked
    </span>
  )
}

export default function InventoryPanel({ open, onClose }) {
  const mainSlots = useInventoryStore((state) => state.mainSlots)
  const usableSlots = useInventoryStore((state) => state.usableSlots)
  const craftSlots = useInventoryStore((state) => state.craftSlots)
  const craftResult = useInventoryStore((state) => state.craftResult)
  const unlockedSlotCount = useInventoryStore((state) => state.unlockedSlotCount)
  const moveItem = useInventoryStore((state) => state.moveItem)
  const craftCurrentRecipe = useInventoryStore((state) => state.craftCurrentRecipe)
  const craftRecipeById = useInventoryStore((state) => state.craftRecipeById)
  const consumeSlotItem = useInventoryStore((state) => state.consumeSlotItem)
  const discardItem = useInventoryStore((state) => state.discardItem)
  const recordCraftedItem = useQuestStore((state) => state.recordCraftedItem)
  const recordDiscardedItem = useQuestStore((state) => state.recordDiscardedItem)

  const pressStateRef = useRef(null)
  const dragStateRef = useRef(null)
  const [dragState, setDragState] = useState(null)
  const [pressState, setPressState] = useState(null)
  const [selectedSlotKey, setSelectedSlotKey] = useState(null)
  const [itemActionPopover, setItemActionPopover] = useState(null)
  const [actionFeedback, setActionFeedback] = useState(null)

  const dragSourceKey = dragState?.sourceKey || null
  const dropTargetKey = dragState?.targetKey || null
  const mainUnlockedCount = getUnlockedSlotCountForArea(unlockedSlotCount, "main")

  const getStackForArea = useCallback(
    (area, index) => {
      if (area === "main") return mainSlots[index] || null
      if (area === "usable") return usableSlots[index] || null
      if (area === "craft") return craftSlots[index] || null
      return null
    },
    [craftSlots, mainSlots, usableSlots]
  )

  const showActionFeedback = useCallback((message) => {
    if (!message) return
    setActionFeedback(message)
  }, [])

  const closeItemActionPopover = useCallback(() => {
    setItemActionPopover(null)
  }, [])

  const openItemActionPopover = useCallback((slotKey, area, index, stack, anchorRect) => {
    if (!stack?.itemId || !["main", "usable"].includes(area)) {
      setItemActionPopover(null)
      return
    }

    const estimatedPopoverWidth = 188
    const estimatedPopoverHeight = 144
    const preferredTop = anchorRect.bottom + 8
    const fallbackTop = anchorRect.top - estimatedPopoverHeight - 8

    setItemActionPopover({
      slotKey,
      area,
      index,
      left: Math.min(
        Math.max(16, anchorRect.left - 6),
        Math.max(16, window.innerWidth - estimatedPopoverWidth - 16)
      ),
      top:
        preferredTop <= window.innerHeight - estimatedPopoverHeight - 16
          ? preferredTop
          : Math.max(16, fallbackTop),
    })
  }, [])

  const handlePointerMove = useCallback((event) => {
    const currentDrag = dragStateRef.current

    if (currentDrag) {
      const hovered = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-slot-key]")

      setDragState((activeDragState) => {
        if (!activeDragState) return activeDragState

        const nextActiveDragState = {
          ...activeDragState,
          x: event.clientX,
          y: event.clientY,
          targetKey: hovered?.dataset?.slotKey || null,
        }

        dragStateRef.current = nextActiveDragState
        return nextActiveDragState
      })
      return
    }

    const currentPress = pressStateRef.current
    if (!currentPress?.stack?.itemId) return

    const distance = Math.hypot(
      event.clientX - currentPress.originX,
      event.clientY - currentPress.originY
    )

    if (distance < CLICK_DRAG_THRESHOLD_PX) return

    const hovered = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-slot-key]")

    const nextDragState = {
      source: currentPress.source,
      sourceKey: currentPress.sourceKey,
      targetKey: hovered?.dataset?.slotKey || null,
      stack: currentPress.stack,
      x: event.clientX,
      y: event.clientY,
    }

    pressStateRef.current = null
    dragStateRef.current = nextDragState
    setPressState(null)
    setItemActionPopover(null)
    setDragState(nextDragState)
  }, [])

  const handlePointerEnd = useCallback(
    (event) => {
      const currentDrag = dragStateRef.current

      if (currentDrag) {
        const hovered = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest("[data-slot-key]")
        const target = parseSlotKey(hovered?.dataset?.slotKey || currentDrag.targetKey)

        if (
          target &&
          target.area !== "result" &&
          (target.area !== currentDrag.source.area || target.index !== currentDrag.source.index)
        ) {
          moveItem(currentDrag.source, target)
        }

        dragStateRef.current = null
        setDragState(null)
        return
      }

      const currentPress = pressStateRef.current
      if (!currentPress) return

      pressStateRef.current = null
      setPressState(null)

      const hoveredSlotKey =
        document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest("[data-slot-key]")
          ?.dataset?.slotKey || currentPress.sourceKey

      if (hoveredSlotKey !== currentPress.sourceKey) {
        setItemActionPopover(null)
        return
      }

      setSelectedSlotKey(currentPress.sourceKey)

      const currentStack =
        getStackForArea(currentPress.source.area, currentPress.source.index) || currentPress.stack

      if (!currentStack?.itemId) {
        setItemActionPopover(null)
        return
      }

      if (["main", "usable"].includes(currentPress.source.area)) {
        openItemActionPopover(
          currentPress.sourceKey,
          currentPress.source.area,
          currentPress.source.index,
          currentStack,
          currentPress.anchorRect
        )
        return
      }

      setItemActionPopover(null)
    },
    [getStackForArea, moveItem, openItemActionPopover]
  )

  useEffect(() => {
    pressStateRef.current = pressState
  }, [pressState])

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  useEffect(() => {
    if (!open) return undefined

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerEnd)
    window.addEventListener("pointercancel", handlePointerEnd)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerEnd)
      window.removeEventListener("pointercancel", handlePointerEnd)
    }
  }, [handlePointerEnd, handlePointerMove, open])

  useEffect(() => {
    if (!actionFeedback) return undefined

    const timeoutId = window.setTimeout(() => {
      setActionFeedback(null)
    }, ACTION_FEEDBACK_DURATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [actionFeedback])

  useEffect(() => {
    if (open) return
    dragStateRef.current = null
    pressStateRef.current = null
    setDragState(null)
    setPressState(null)
    setSelectedSlotKey(null)
    setItemActionPopover(null)
    setActionFeedback(null)
  }, [open])

  const handleSlotPointerDown = useCallback(
    (event, area, index, stack) => {
      event.preventDefault()
      event.stopPropagation()

      const slotKey = `${area}:${index}`
      setSelectedSlotKey(slotKey)
      setItemActionPopover(null)

      if (!stack?.itemId) {
        pressStateRef.current = null
        setPressState(null)
        return
      }

      const nextPressState = {
        source: { area, index },
        sourceKey: slotKey,
        stack,
        originX: event.clientX,
        originY: event.clientY,
        anchorRect: event.currentTarget.getBoundingClientRect(),
      }

      pressStateRef.current = nextPressState
      setPressState(nextPressState)
    },
    []
  )

  const notifyCraftedOutputs = useCallback(
    (outputs = []) => {
      outputs.forEach((output) => {
        if (!output?.itemId) return
        const quantity = Math.max(0, Number(output.quantity) || 0)
        if (quantity <= 0) return
        recordCraftedItem(output.itemId, quantity)
      })
    },
    [recordCraftedItem]
  )

  const handleCraftResultClick = useCallback(() => {
    const result = craftCurrentRecipe()
    if (result?.success) {
      notifyCraftedOutputs(result.outputs)
    }
  }, [craftCurrentRecipe, notifyCraftedOutputs])

  const handleCraftRecipe = useCallback(
    (recipeId) => {
      const result = craftRecipeById(recipeId)
      if (result?.success) {
        notifyCraftedOutputs(result.outputs)
      }
    },
    [craftRecipeById, notifyCraftedOutputs]
  )

  const selectedSlot = useMemo(() => parseSlotKey(selectedSlotKey), [selectedSlotKey])

  const selectedStack = useMemo(() => {
    if (!selectedSlot) return null
    if (selectedSlot.area === "main") return mainSlots[selectedSlot.index] || null
    if (selectedSlot.area === "usable") return usableSlots[selectedSlot.index] || null
    if (selectedSlot.area === "craft") return craftSlots[selectedSlot.index] || null
    return null
  }, [craftSlots, mainSlots, selectedSlot, usableSlots])

  const selectedItemDefinition = selectedStack?.itemId
    ? getItemDefinition(selectedStack.itemId)
    : null
  const selectedSlotSupportsActions =
    Boolean(selectedStack?.itemId) && ["main", "usable"].includes(selectedSlot?.area)
  const selectedItemCanUse =
    selectedSlotSupportsActions && canUseItemDefinition(selectedItemDefinition)
  const selectedItemCanThrow =
    selectedSlotSupportsActions && selectedItemDefinition?.discardable === true

  const actionPopoverStack = itemActionPopover
    ? getStackForArea(itemActionPopover.area, itemActionPopover.index)
    : null
  const actionPopoverItemDefinition = actionPopoverStack?.itemId
    ? getItemDefinition(actionPopoverStack.itemId)
    : null
  const canUsePopoverItem = canUseItemDefinition(actionPopoverItemDefinition)
  const canThrowPopoverItem = actionPopoverItemDefinition?.discardable === true
  const canEquipPopoverItem =
    Boolean(actionPopoverItemDefinition?.equipable) && itemActionPopover?.area === "main"

  useEffect(() => {
    if (!itemActionPopover) return

    if (!actionPopoverStack?.itemId) {
      setItemActionPopover(null)
    }
  }, [actionPopoverStack, itemActionPopover])

  const handleUseSelectedItem = useCallback(() => {
    if (!itemActionPopover) return

    const stack = getStackForArea(itemActionPopover.area, itemActionPopover.index)
    const itemDefinition = stack?.itemId ? getItemDefinition(stack.itemId) : null

    if (!stack?.itemId || !itemDefinition) {
      setItemActionPopover(null)
      return
    }

    const foodEffects = getFoodUseEffects(itemDefinition.food)
    const useEffects = itemDefinition.useEffects || foodEffects
    const isEdibleFood = itemDefinition.food?.edible === true
    const isConsumableUse =
      isEdibleFood || (itemDefinition.usable === true && hasAnyEffectValue(useEffects))

    if (!canUseItemDefinition(itemDefinition)) {
      setItemActionPopover(null)
      return
    }

    if (!isConsumableUse) {
      showActionFeedback(`${itemDefinition.name} can't be used here yet.`)
      setItemActionPopover(null)
      return
    }

    const consumed = consumeSlotItem(itemActionPopover.area, itemActionPopover.index, 1)
    if (!consumed) {
      setItemActionPopover(null)
      return
    }

    if (useEffects) {
      usePetStore.getState().applyEffects(useEffects)
    }

    showActionFeedback(`Used ${itemDefinition.name}`)
    setItemActionPopover(null)
  }, [consumeSlotItem, getStackForArea, itemActionPopover, showActionFeedback])

  const handleEquipPopoverItem = useCallback((targetSlotIndex) => {
    if (!itemActionPopover) return

    const source = { area: itemActionPopover.area, index: itemActionPopover.index }
    const target = { area: "usable", index: targetSlotIndex }
    moveItem(source, target)
    setItemActionPopover(null)
    showActionFeedback(`Equipped to slot ${targetSlotIndex + 1}`)
  }, [itemActionPopover, moveItem, showActionFeedback])

  const handleThrowSelectedItem = useCallback(() => {
    if (!itemActionPopover) return

    const result = discardItem(itemActionPopover.area, itemActionPopover.index, 1)
    if (!result?.success) {
      setItemActionPopover(null)
      return
    }

    recordDiscardedItem(result.itemId, result.quantity)

    showActionFeedback(`Threw ${getItemDefinition(result.itemId)?.name || result.itemId}`)
    setItemActionPopover(null)
  }, [discardItem, itemActionPopover, recordDiscardedItem, showActionFeedback])

  const draggedStack = dragState?.stack || null

  const dragPreview = useMemo(() => {
    if (!draggedStack?.itemId || !dragState) return null

    return (
      <div
        style={{
          position: "fixed",
          left: `${dragState.x}px`,
          top: `${dragState.y}px`,
          width: "42px",
          height: "42px",
          transform: "translate(-50%, -50%)",
          borderRadius: "10px",
          background: "rgba(18, 18, 18, 0.92)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: POPIN_Z_INDEX + 1,
        }}
      >
        <ItemVisual itemId={draggedStack.itemId} size={24} emojiSize={22} />
        {draggedStack.quantity > 1 && (
          <span
            style={{
              position: "absolute",
              right: "3px",
              bottom: "2px",
              minWidth: "14px",
              height: "14px",
              padding: "0 2px",
              fontSize: "9px",
              fontWeight: 700,
              color: "#fff",
              background: "rgba(0,0,0,0.7)",
              borderRadius: "4px",
            }}
          >
            {draggedStack.quantity}
          </span>
        )}
      </div>
    )
  }, [dragState, draggedStack])

  if (!open) return null

  return (
    <>
      <div
        aria-hidden="true"
        onPointerDown={(event) => {
          event.stopPropagation()
          onClose?.()
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: OVERLAY_Z_INDEX,
          background: "rgba(0, 0, 0, 0.46)",
          backdropFilter: "blur(3px)",
          pointerEvents: "auto",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        onPointerDown={(event) => {
          event.stopPropagation()

          if (!(event.target instanceof Element)) return
          if (event.target.closest("[data-item-action-popover]")) return
          if (event.target.closest("[data-inventory-slot]")) return

          closeItemActionPopover()
        }}
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(1180px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 30px)",
          zIndex: POPIN_Z_INDEX,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          padding: "16px",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(10, 10, 10, 0.92)",
          color: "#fff",
          boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
          pointerEvents: "auto",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <strong
              style={{
                fontSize: "15px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#fff3c6",
              }}
            >
              Inventory
            </strong>
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {`${unlockedSlotCount}/${INVENTORY_MAX_VISUAL_CAPACITY} slots unlocked`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              padding: "8px 12px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
            minHeight: 0,
            overflow: "hidden",
            flexWrap: "wrap",
          }}
        >
          <section
            style={{
              flex: "1 1 620px",
              minWidth: "min(100%, 620px)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minHeight: 0,
            }}
          >
            <div
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Quick Slots
                </strong>
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  5 hotbar slots
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 44px)",
                  gap: "8px",
                  justifyContent: "start",
                }}
              >
                {usableSlots.map((stack, index) => {
                  const slotKey = `usable:${index}`
                  const selected = selectedSlotKey === slotKey

                  return (
                    <div
                      key={slotKey}
                      style={{
                        padding: selected ? "1px" : 0,
                        borderRadius: "8px",
                        boxShadow: selected ? "0 0 0 1px rgba(255,227,130,0.7)" : "none",
                      }}
                    >
                      <InventorySlot
                        slotKey={slotKey}
                        stack={stack}
                        style={STORAGE_SLOT_STYLE}
                        isDragSource={dragSourceKey === slotKey}
                        isDropTarget={dropTargetKey === slotKey}
                        onPointerDown={(event) =>
                          handleSlotPointerDown(event, "usable", index, stack)
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Bag Slots
                </strong>
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {`${mainUnlockedCount}/${INVENTORY_MAIN_SLOT_COUNT} bag slots unlocked`}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(44px, 44px))",
                  gap: "8px",
                  alignContent: "start",
                  justifyContent: "start",
                  overflowY: "auto",
                  maxHeight: "min(46vh, 420px)",
                  paddingRight: "4px",
                }}
              >
                {mainSlots.map((stack, index) => {
                  const slotKey = `main:${index}`
                  const selected = selectedSlotKey === slotKey
                  const unlocked = isInventorySlotUnlocked({ unlockedSlotCount }, "main", index)

                  return (
                    <div
                      key={slotKey}
                      style={{
                        padding: selected ? "1px" : 0,
                        borderRadius: "8px",
                        boxShadow: selected ? "0 0 0 1px rgba(255,227,130,0.7)" : "none",
                      }}
                    >
                      <InventorySlot
                        slotKey={slotKey}
                        stack={stack}
                        style={STORAGE_SLOT_STYLE}
                        isDragSource={dragSourceKey === slotKey}
                        isDropTarget={dropTargetKey === slotKey}
                        isDisabled={!unlocked}
                        onPointerDown={(event) =>
                          unlocked ? handleSlotPointerDown(event, "main", index, stack) : undefined
                        }
                      >
                        {!unlocked ? renderLockedOverlay() : null}
                      </InventorySlot>
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Craft Grid
                </strong>
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  Drag items in or use recipes
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 44px)",
                    gap: "8px",
                  }}
                >
                  {craftSlots.map((stack, index) => {
                    const slotKey = `craft:${index}`
                    const selected = selectedSlotKey === slotKey

                    return (
                      <div
                        key={slotKey}
                        style={{
                          padding: selected ? "1px" : 0,
                          borderRadius: "8px",
                          boxShadow: selected ? "0 0 0 1px rgba(255,227,130,0.7)" : "none",
                        }}
                      >
                        <InventorySlot
                          slotKey={slotKey}
                          stack={stack}
                          style={STORAGE_SLOT_STYLE}
                          isDragSource={dragSourceKey === slotKey}
                          isDropTarget={dropTargetKey === slotKey}
                          onPointerDown={(event) =>
                            handleSlotPointerDown(event, "craft", index, stack)
                          }
                        />
                      </div>
                    )
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.58)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Result
                  </span>
                  <InventorySlot
                    slotKey="result:0"
                    slotType="result"
                    stack={craftResult}
                    style={STORAGE_SLOT_STYLE}
                    onClick={handleCraftResultClick}
                  />
                </div>
              </div>
            </div>
          </section>

          <aside
            style={{
              flex: "0 1 320px",
              minWidth: "min(100%, 320px)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minHeight: 0,
            }}
          >
            <section
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <strong
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#fff3c6",
                }}
              >
                Selected Item
              </strong>

              {selectedStack?.itemId ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ItemVisual itemId={selectedStack.itemId} size={24} emojiSize={22} />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "13px",
                          color: "#fff",
                        }}
                      >
                        {selectedItemDefinition?.name || selectedStack.itemId}
                      </strong>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.6)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {`Qty ${selectedStack.quantity}`}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      lineHeight: 1.5,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    {selectedItemDefinition?.description || "No description available."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.58)",
                      }}
                    >
                      {selectedSlotSupportsActions
                        ? "Click the slot to open Use / Throw / Cancel."
                        : "Craft slots are for recipe setup and dragging only."}
                    </span>

                    <span
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {selectedSlotSupportsActions
                        ? selectedItemCanUse && selectedItemCanThrow
                          ? "Tap for actions, or drag the item to move it."
                          : selectedItemCanUse
                            ? "This item can be used, but protected items cannot be thrown."
                            : selectedItemCanThrow
                              ? "This item can be thrown away, but it has no use action yet."
                              : "This item has no current use action and is protected from throw."
                        : "Drag items between bag, quick slots, and craft slots."}
                    </span>
                  </div>
                </>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.62)",
                  }}
                >
                  Select an inventory slot to inspect it. Click a carried item for actions, or drag it to move it.
                </p>
              )}
            </section>

            <section
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minHeight: 0,
              }}
            >
              <strong
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#fff3c6",
                }}
              >
                Craft Result
              </strong>

              {craftResult?.itemId ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  <ItemVisual itemId={craftResult.itemId} size={18} emojiSize={16} />
                  <span>{getObjectiveLabel(craftResult)}</span>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  No valid craft recipe in the manual grid yet.
                </span>
              )}
            </section>

            <aside
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                padding: "12px",
                color: "rgba(255,255,255,0.78)",
                minHeight: "260px",
                maxHeight: "min(46vh, 520px)",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <RecipePanel
                mainSlots={mainSlots}
                usableSlots={usableSlots}
                onCraftRecipe={handleCraftRecipe}
              />
            </aside>
          </aside>
        </div>
      </div>

      {itemActionPopover && actionPopoverStack?.itemId ? (
        <div
          data-item-action-popover="true"
          style={{
            position: "fixed",
            left: `${itemActionPopover.left}px`,
            top: `${itemActionPopover.top}px`,
            width: "172px",
            zIndex: POPIN_Z_INDEX + 2,
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(14, 14, 14, 0.96)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 4px 8px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ItemVisual itemId={actionPopoverStack.itemId} size={18} emojiSize={16} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                minWidth: 0,
              }}
            >
              <strong
                style={{
                  fontSize: "11px",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {actionPopoverItemDefinition?.name || actionPopoverStack.itemId}
              </strong>
              <span
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.54)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {`Qty ${actionPopoverStack.quantity}`}
              </span>
            </div>
          </div>

          {[
            {
              label: "Use",
              disabled: !canUsePopoverItem,
              onClick: handleUseSelectedItem,
            },
            {
              label: "Throw",
              disabled: !canThrowPopoverItem,
              onClick: handleThrowSelectedItem,
            },
            {
              label: "Cancel",
              disabled: false,
              onClick: closeItemActionPopover,
            },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                background: action.disabled
                  ? "rgba(255,255,255,0.05)"
                  : action.label === "Throw"
                    ? "rgba(255, 109, 109, 0.14)"
                    : action.label === "Use"
                      ? "rgba(255, 227, 130, 0.14)"
                      : "rgba(255,255,255,0.08)",
                color: action.disabled
                  ? "rgba(255,255,255,0.4)"
                  : action.label === "Throw"
                    ? "#ffd9d9"
                    : action.label === "Use"
                      ? "#fff3c6"
                      : "#ffffff",
                padding: "8px 10px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: action.disabled ? "not-allowed" : "pointer",
              }}
            >
              {action.label}
            </button>
          ))}

          {canEquipPopoverItem && (
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "0 2px",
                }}
              >
                Equip to slot
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {usableSlots.map((slotStack, slotIndex) => (
                  <button
                    key={slotIndex}
                    type="button"
                    onClick={() => handleEquipPopoverItem(slotIndex)}
                    title={slotStack?.itemId ? `Replace ${slotStack.itemId}` : `Slot ${slotIndex + 1}`}
                    style={{
                      flex: 1,
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: "6px",
                      background: slotStack?.itemId
                        ? "rgba(255,227,130,0.1)"
                        : "rgba(255,255,255,0.06)",
                      color: "#fff",
                      padding: "5px 0",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {slotIndex + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {actionFeedback ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "34px",
            transform: "translateX(-50%)",
            zIndex: POPIN_Z_INDEX + 3,
            padding: "9px 13px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(10, 10, 10, 0.92)",
            color: "#fff",
            fontSize: "11px",
            lineHeight: 1.35,
            boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
            pointerEvents: "none",
            textAlign: "center",
            maxWidth: "min(340px, calc(100vw - 32px))",
          }}
        >
          {actionFeedback}
        </div>
      ) : null}

      {dragPreview}
    </>
  )
}
