import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import TintedCtaButton from "../../components/TintedCtaButton"
import closeButton from "../../hud/CTAs/CTA_Small_8BIT_Close.webp"
import closeButtonPressed from "../../hud/CTAs/CTA_Small_8BIT_Close_Pressed.webp"
import mediumCta from "../../hud/CTAs/CTA_Medium_8BIT.webp"
import mediumCtaPressed from "../../hud/CTAs/CTA_Medium_8BIT_Pressed.webp"
import { usePetStore } from "../store/usePetstore"
import { QUEST_CHAIN_ORDER } from "../config/questConfig"
import { getQuestSummaryById, useQuestStore } from "../store/useQuestStore"
import QuestCard, {
  QUEST_CARD_ACTIVE_SCALE,
  QUEST_CARD_BASE_HEIGHT,
  QUEST_CARD_BASE_WIDTH,
  QUEST_CARD_SCALE,
  getQuestCardMetrics,
} from "./QuestCard"

const OVERLAY_Z_INDEX = 1000002
const CONTENT_Z_INDEX = 1000004
const CLOSE_BUTTON_SIZE = 52
const CLAIM_BUTTON_WIDTH = 196
const CLAIM_BUTTON_HEIGHT = 52
const OVERLAY_HORIZONTAL_PADDING = 28
const OVERLAY_VERTICAL_RESERVE = 184
const HEADER_GAP = 22

function isQuestSelectable(quest) {
  if (!quest) return false
  if (quest.status === "locked") return false
  if (quest.repeatable === true) return true
  return !(quest.rewardClaimed || quest.status === "claimed")
}

function canClaimQuest(quest) {
  return quest?.status === "completed" && !quest.rewardClaimed
}

function getSelectedQuestId(questSummaries, activeQuestId) {
  const activeQuest = questSummaries.find((quest) => quest.id === activeQuestId)
  if (activeQuest && isQuestSelectable(activeQuest)) {
    return activeQuest.id
  }

  const firstSelectableQuest = questSummaries.find((quest) => isQuestSelectable(quest))
  if (firstSelectableQuest) {
    return firstSelectableQuest.id
  }

  const firstVisibleQuest = questSummaries.find((quest) => quest.status !== "locked")
  if (firstVisibleQuest) {
    return firstVisibleQuest.id
  }

  return questSummaries[0]?.id || null
}

export default function QuestPanel({ open, onClose }) {
  const unlockedQuestIds = useQuestStore((state) => state.unlockedQuestIds)
  const activeQuestId = useQuestStore((state) => state.activeQuestId)
  const completedQuestIds = useQuestStore((state) => state.completedQuestIds)
  const claimedQuestIds = useQuestStore((state) => state.claimedQuestIds)
  const rewardClaimedQuestIds = useQuestStore((state) => state.rewardClaimedQuestIds)
  const objectiveProgress = useQuestStore((state) => state.objectiveProgress)
  const setActiveQuest = useQuestStore((state) => state.setActiveQuest)
  const claimQuestRewards = useQuestStore((state) => state.claimQuestRewards)
  const modelColor = usePetStore((state) => state.theme.modelColor)

  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  }))

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateViewportSize()
    window.addEventListener("resize", updateViewportSize)

    return () => {
      window.removeEventListener("resize", updateViewportSize)
    }
  }, [])

  const questState = useMemo(
    () => ({
      unlockedQuestIds,
      activeQuestId,
      completedQuestIds,
      claimedQuestIds,
      rewardClaimedQuestIds,
      objectiveProgress,
    }),
    [
      activeQuestId,
      claimedQuestIds,
      completedQuestIds,
      objectiveProgress,
      rewardClaimedQuestIds,
      unlockedQuestIds,
    ]
  )

  const questSummaries = useMemo(
    () =>
      QUEST_CHAIN_ORDER.map((questId) => getQuestSummaryById(questId, questState)).filter(Boolean),
    [questState]
  )

  const selectedQuestId = useMemo(
    () => getSelectedQuestId(questSummaries, questState.activeQuestId),
    [questState.activeQuestId, questSummaries]
  )

  const orderedQuestSummaries = useMemo(() => {
    const claimedOrCompleted = []
    const available = []
    const locked = []
    let selectedQuest = null

    questSummaries.forEach((quest) => {
      if (quest.id === selectedQuestId) {
        selectedQuest = quest
        return
      }

      if (quest.status === "locked") {
        locked.push(quest)
        return
      }

      if (quest.rewardClaimed || quest.status === "claimed" || quest.status === "completed") {
        claimedOrCompleted.push(quest)
        return
      }

      available.push(quest)
    })

    return [...claimedOrCompleted, ...(selectedQuest ? [selectedQuest] : []), ...available, ...locked]
  }, [questSummaries, selectedQuestId])

  const selectedQuest = useMemo(
    () => orderedQuestSummaries.find((quest) => quest.id === selectedQuestId) || null,
    [orderedQuestSummaries, selectedQuestId]
  )

  const orderedQuestKey = useMemo(
    () => orderedQuestSummaries.map((quest) => quest.id).join("|"),
    [orderedQuestSummaries]
  )

  const claimableQuestCount = useMemo(
    () => questSummaries.filter((quest) => canClaimQuest(quest)).length,
    [questSummaries]
  )

  const fitFactor = useMemo(() => {
    const availableWidth = Math.max(220, viewportSize.width - OVERLAY_HORIZONTAL_PADDING * 2)
    const availableHeight = Math.max(360, viewportSize.height - OVERLAY_VERTICAL_RESERVE)
    const activeBaseWidth = QUEST_CARD_BASE_WIDTH * QUEST_CARD_ACTIVE_SCALE
    const activeBaseHeight = QUEST_CARD_BASE_HEIGHT * QUEST_CARD_ACTIVE_SCALE
    const widthFit = availableWidth / activeBaseWidth
    const heightFit = availableHeight / activeBaseHeight

    return Math.min(1, widthFit, heightFit)
  }, [viewportSize.height, viewportSize.width])

  const activeCardScale = QUEST_CARD_ACTIVE_SCALE * fitFactor
  const inactiveCardScale = QUEST_CARD_SCALE * fitFactor
  const activeCardMetrics = useMemo(
    () => getQuestCardMetrics(activeCardScale),
    [activeCardScale]
  )
  const inactiveCardMetrics = useMemo(
    () => getQuestCardMetrics(inactiveCardScale),
    [inactiveCardScale]
  )
  const carouselViewportRef = useRef(null)
  const cardSlotRefs = useRef(new Map())
  const wasOpenRef = useRef(false)
  const [containerWidth, setContainerWidth] = useState(0)

  const carouselGap = Math.max(6, Math.round(10 * fitFactor))
  const carouselPaddingBlock = Math.max(56, Math.round(72 * fitFactor))
  const claimButtonMarginTop = Math.max(16, Math.round(22 * fitFactor))
  const spacerWidth = Math.max(
    OVERLAY_HORIZONTAL_PADDING,
    Math.round(containerWidth / 2 - activeCardMetrics.width / 2 - carouselGap)
  )

  useLayoutEffect(() => {
    const el = carouselViewportRef.current
    if (!el) return undefined

    setContainerWidth(el.clientWidth)

    if (typeof ResizeObserver === "undefined") return undefined

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    ro.observe(el)

    return () => ro.disconnect()
  }, [open])

  const centerSelectedCard = useCallback(
    (behavior = "auto") => {
      const container = carouselViewportRef.current
      const selectedSlot = cardSlotRefs.current.get(selectedQuestId)
      if (!container || !selectedSlot) return

      const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth)
      const targetLeft =
        selectedSlot.offsetLeft - (container.clientWidth - selectedSlot.clientWidth) / 2
      const clampedLeft = Math.max(0, Math.min(maxScrollLeft, targetLeft))

      container.scrollTo({
        left: clampedLeft,
        behavior,
      })
    },
    [selectedQuestId]
  )

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return undefined
    }

    if (!selectedQuestId) return undefined

    const behavior = wasOpenRef.current ? "smooth" : "auto"
    const frameId = window.requestAnimationFrame(() => {
      centerSelectedCard(behavior)
      wasOpenRef.current = true
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [activeCardMetrics.width, centerSelectedCard, open, orderedQuestKey, selectedQuestId])

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined

    const handleViewportRealign = () => {
      window.requestAnimationFrame(() => centerSelectedCard("auto"))
    }

    window.addEventListener("resize", handleViewportRealign)

    let resizeObserver = null
    if (typeof ResizeObserver !== "undefined" && carouselViewportRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleViewportRealign()
      })
      resizeObserver.observe(carouselViewportRef.current)
    }

    return () => {
      window.removeEventListener("resize", handleViewportRealign)
      resizeObserver?.disconnect()
    }
  }, [centerSelectedCard, open])

  if (!open) return null

  return (
    <>
      <style>{`
        .quest-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
          background: "rgba(2, 6, 12, 0.54)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          pointerEvents: "auto",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quest carousel"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: CONTENT_Z_INDEX,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${HEADER_GAP}px`,
          padding: "20px 0 28px",
          boxSizing: "border-box",
          overflow: "visible",
        }}
      >
        <div
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            pointerEvents: "auto",
            width: "min(920px, calc(100vw - 44px))",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "18px",
            color: "#ffffff",
            textShadow: "0 6px 18px rgba(0,0,0,0.45)",
            overflow: "visible",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              minWidth: 0,
            }}
          >
            <strong
              style={{
                fontSize: "24px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Quests
            </strong>
            <span
              style={{
                fontSize: "12px",
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {claimableQuestCount > 0
                ? `${claimableQuestCount} quest reward${claimableQuestCount === 1 ? "" : "s"} ready to claim`
                : "Select a quest card to track the next step in the chain."}
            </span>
          </div>

          <TintedCtaButton
            ariaLabel="Close quests"
            defaultSrc={closeButton}
            pressedSrc={closeButtonPressed}
            tintColor={modelColor || "#8f8f8f"}
            onClick={() => onClose?.()}
            width={`${CLOSE_BUTTON_SIZE}px`}
            height={`${CLOSE_BUTTON_SIZE}px`}
            style={{
              pointerEvents: "auto",
              flexShrink: 0,
            }}
          />
        </div>

        <div
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: `${claimButtonMarginTop}px`,
            pointerEvents: "auto",
            overflow: "visible",
          }}
        >
          <div
            ref={carouselViewportRef}
            className="quest-carousel"
            style={{
              width: "100%",
              overflowX: "auto",
              overflowY: "visible",
              scrollBehavior: "smooth",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: `${carouselGap}px`,
                paddingBlock: `${carouselPaddingBlock}px`,
                boxSizing: "border-box",
                overflow: "visible",
              }}
            >
              {/* Left spacer: lets first card reach viewport center */}
              <div
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  flexGrow: 0,
                  width: `${spacerWidth}px`,
                  height: 0,
                  pointerEvents: "none",
                }}
              />

              {orderedQuestSummaries.map((quest) => {
                const isSelected = quest.id === selectedQuestId
                const isSelectable = isQuestSelectable(quest)
                const cardScale = isSelected ? activeCardScale : inactiveCardScale
                const slotMetrics = isSelected ? activeCardMetrics : inactiveCardMetrics

                return (
                  <div
                    key={quest.id}
                    ref={(node) => {
                      if (node) {
                        cardSlotRefs.current.set(quest.id, node)
                        return
                      }

                      cardSlotRefs.current.delete(quest.id)
                    }}
                    style={{
                      flex: `0 0 ${slotMetrics.width}px`,
                      width: `${slotMetrics.width}px`,
                      height: `${slotMetrics.height}px`,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      scrollSnapAlign: "center",
                      scrollSnapStop: "always",
                      overflow: "visible",
                      background: "transparent",
                    }}
                  >
                    <QuestCard
                      quest={quest}
                      scale={cardScale}
                      isActive={isSelected}
                      isSelectable={isSelectable}
                      ariaLabel={isSelectable ? `Select ${quest.title}` : `${quest.title} unavailable`}
                      onSelect={() => {
                        if (!isSelectable || isSelected) return
                        setActiveQuest(quest.id)
                      }}
                    />
                  </div>
                )
              })}

              {/* Right spacer: lets last card reach viewport center */}
              <div
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  flexGrow: 0,
                  width: `${spacerWidth}px`,
                  height: 0,
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {selectedQuest ? (
            <TintedCtaButton
              ariaLabel={
                canClaimQuest(selectedQuest)
                  ? `Claim rewards for ${selectedQuest.title}`
                  : `Claim unavailable for ${selectedQuest.title}`
              }
              defaultSrc={mediumCta}
              pressedSrc={mediumCtaPressed}
              tintColor={canClaimQuest(selectedQuest) ? modelColor || "#8f8f8f" : "#58606d"}
              label={canClaimQuest(selectedQuest) ? "Claim Reward" : "Not Ready"}
              labelClassName="hud-ui-text hud-ui-text--cta"
              onClick={() => {
                if (!canClaimQuest(selectedQuest)) return
                claimQuestRewards(selectedQuest.id)
              }}
              disabled={!canClaimQuest(selectedQuest)}
              width={`${CLAIM_BUTTON_WIDTH}px`}
              height={`${CLAIM_BUTTON_HEIGHT}px`}
              style={{
                pointerEvents: "auto",
                flexShrink: 0,
              }}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
