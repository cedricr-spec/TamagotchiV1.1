import React from "react"
import { getItemDefinition } from "../config/itemsRegistry"
import { QUEST_OBJECTIVE_TYPES } from "../config/questConfig"
import { getActiveQuestSummary, useQuestStore } from "../store/useQuestStore"

function getItemLabel(itemId) {
  return getItemDefinition(itemId)?.name || itemId || "Unknown Item"
}

function formatObjectiveLabel(objective) {
  const itemLabel = getItemLabel(objective.itemId)

  if (objective.type === QUEST_OBJECTIVE_TYPES.COLLECT_ITEM) {
    return `Collect ${itemLabel}`
  }

  if (objective.type === QUEST_OBJECTIVE_TYPES.CRAFT_ITEM) {
    return `Craft ${itemLabel}`
  }

  if (objective.type === QUEST_OBJECTIVE_TYPES.DISCARD_ITEM) {
    return `Discard ${itemLabel}`
  }

  return itemLabel
}

const ACTIVE_QUEST_TRACKER_MOBILE_MEDIA_QUERY = "(max-width: 768px)"

function useIsMobileQuestTrackerHidden() {
  const [hidden, setHidden] = React.useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(ACTIVE_QUEST_TRACKER_MOBILE_MEDIA_QUERY).matches
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined

    const mediaQuery = window.matchMedia(ACTIVE_QUEST_TRACKER_MOBILE_MEDIA_QUERY)
    const updateHidden = () => setHidden(mediaQuery.matches)

    updateHidden()
    mediaQuery.addEventListener?.("change", updateHidden)

    return () => {
      mediaQuery.removeEventListener?.("change", updateHidden)
    }
  }, [])

  return hidden
}

export default function ActiveQuestTracker() {
  const hideOnMobile = useIsMobileQuestTrackerHidden()
  const activeQuestId = useQuestStore((state) => state.activeQuestId)
  const unlockedQuestIds = useQuestStore((state) => state.unlockedQuestIds)
  const completedQuestIds = useQuestStore((state) => state.completedQuestIds)
  const claimedQuestIds = useQuestStore((state) => state.claimedQuestIds)
  const rewardClaimedQuestIds = useQuestStore((state) => state.rewardClaimedQuestIds)
  const objectiveProgress = useQuestStore((state) => state.objectiveProgress)

  const activeQuest = React.useMemo(
    () =>
      getActiveQuestSummary({
        activeQuestId,
        unlockedQuestIds,
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

  if (!activeQuest || hideOnMobile) return null

  return (
    <div
      style={{
        position: "fixed",
        top: "76px",
        right: "20px",
        width: "min(320px, calc(100vw - 32px))",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10, 10, 10, 0.78)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        color: "#fff",
        zIndex: 10001,
        pointerEvents: "none",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.56)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Active Quest
        </span>
        <strong
          style={{
            fontSize: "13px",
            color: "#fff3c6",
          }}
        >
          {activeQuest.title}
        </strong>
      </div>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {activeQuest.objectives.map((objective, objectiveIndex) => (
          <div
            key={`${activeQuest.id}:tracker:${objectiveIndex}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.84)",
            }}
          >
            <span>{formatObjectiveLabel(objective)}</span>
            <span>{`${objective.current}/${objective.target}`}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "10px",
          color:
            activeQuest.status === "claimed"
              ? "rgba(191, 255, 201, 0.92)"
              : activeQuest.status === "completed"
                ? "#fff3c6"
                : "rgba(255,255,255,0.58)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {activeQuest.status === "claimed"
          ? "Reward claimed"
          : activeQuest.status === "completed"
            ? "Completed — open Quests to claim"
            : "In progress"}
      </div>
    </div>
  )
}
