import React, { useMemo } from "react"
import questCardBackground from "../../hud/Quête_Background.png"
import { getItemDefinition } from "../config/itemsRegistry"
import { QUEST_OBJECTIVE_TYPES, QUEST_REWARD_TYPES } from "../config/questConfig"

export const QUEST_CARD_BASE_WIDTH = 740
export const QUEST_CARD_BASE_HEIGHT = 1210
export const QUEST_CARD_BASE_PADDING_X = 75
export const QUEST_CARD_BASE_PADDING_Y = 135
export const QUEST_CARD_SCALE = 0.36
export const QUEST_CARD_ACTIVE_SCALE = 0.46

function roundMetric(value) {
  return Math.round(value * 100) / 100
}

export function getQuestCardMetrics(scale) {
  return {
    scale,
    width: roundMetric(QUEST_CARD_BASE_WIDTH * scale),
    height: roundMetric(QUEST_CARD_BASE_HEIGHT * scale),
    paddingX: roundMetric(QUEST_CARD_BASE_PADDING_X * scale),
    paddingY: roundMetric(QUEST_CARD_BASE_PADDING_Y * scale),
    sectionGap: roundMetric(32 * scale),
    framePaddingX: roundMetric(30 * scale),
    framePaddingY: roundMetric(28 * scale),
    iconTile: roundMetric(132 * scale),
    iconSize: roundMetric(70 * scale),
    titleSize: roundMetric(42 * scale),
    bodySize: roundMetric(34 * scale),
    metaSize: roundMetric(24 * scale),
    frameBorderWidth: Math.max(1, roundMetric(2 * scale)),
  }
}

function getItemLabel(itemId) {
  return getItemDefinition(itemId)?.name || itemId || "Unknown item"
}

function getPrimaryObjective(quest) {
  return quest?.objectives?.[0] || null
}

function getPrimaryReward(quest) {
  return quest?.rewards?.[0] || null
}

function getItemIconData(itemId, fallbackLabel = "Quest") {
  const itemDefinition = itemId ? getItemDefinition(itemId) : null
  const atlasRect =
    itemDefinition?.atlasRect ||
    itemDefinition?.atlas?.rect ||
    itemDefinition?.spriteRect ||
    null
  const atlasSource =
    itemDefinition?.atlasSource ||
    itemDefinition?.atlas?.source ||
    itemDefinition?.spritesheet ||
    itemDefinition?.spriteSheet ||
    null
  const spritePath =
    itemDefinition?.spritePath ||
    itemDefinition?.sprite ||
    itemDefinition?.iconPath ||
    null

  return {
    itemId,
    label: itemDefinition?.name || itemId || fallbackLabel,
    atlasSource,
    atlasRect,
    spritePath,
    emoji:
      itemDefinition?.emoji ||
      itemDefinition?.icon ||
      itemDefinition?.iconGlyph ||
      itemDefinition?.glyph ||
      "✦",
  }
}

function getQuestIconData(quest) {
  const objective = getPrimaryObjective(quest)
  const reward = getPrimaryReward(quest)
  const itemId = objective?.itemId || reward?.value || null
  return getItemIconData(itemId, "Quest")
}

function QuestItemIcon({ iconData, metrics }) {
  const displaySize = Math.round(metrics.iconSize * 1.65)
  const atlasRect = iconData?.atlasRect
  const atlasSource = iconData?.atlasSource

  if (atlasSource && atlasRect) {
    const rectX = Number(atlasRect.x ?? atlasRect.left ?? 0)
    const rectY = Number(atlasRect.y ?? atlasRect.top ?? 0)
    const rectWidth = Number(atlasRect.width ?? atlasRect.w ?? 0)
    const rectHeight = Number(atlasRect.height ?? atlasRect.h ?? 0)
    const safeRectWidth = Number.isFinite(rectWidth) && rectWidth > 0 ? rectWidth : 16
    const safeRectHeight = Number.isFinite(rectHeight) && rectHeight > 0 ? rectHeight : 16
    const scale = displaySize / Math.max(safeRectWidth, safeRectHeight)

    return (
      <div
        aria-hidden="true"
        title={iconData.label}
        style={{
          width: displaySize,
          height: displaySize,
          overflow: "hidden",
          position: "relative",
          display: "inline-block",
          imageRendering: "pixelated",
          flexShrink: 0,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: safeRectWidth,
            height: safeRectHeight,
            backgroundImage: `url(${atlasSource})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: `-${rectX}px -${rectY}px`,
            backgroundSize: "auto",
            imageRendering: "pixelated",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    )
  }

  if (iconData?.spritePath) {
    return (
      <img
        src={iconData.spritePath}
        alt=""
        aria-hidden="true"
        title={iconData.label}
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
          objectFit: "contain",
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      title={iconData.label}
      style={{
        fontSize: `${displaySize}px`,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {iconData?.emoji || "✦"}
    </span>
  )
}

function ItemInfoBlock({ metrics, label, primary, secondary, iconData }) {
  const iconBoxSize = Math.round(118 * metrics.scale)
  const iconScaleMetrics = {
    ...metrics,
    iconSize: Math.round(48 * metrics.scale),
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: `${iconBoxSize}px 1fr`,
        alignItems: "center",
        gap: `${Math.round(26 * metrics.scale)}px`,
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: `${iconBoxSize}px`,
          height: `${iconBoxSize}px`,
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.25)",
          boxSizing: "border-box",
        }}
      >
        <QuestItemIcon iconData={iconData} metrics={iconScaleMetrics} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: `${Math.round(12 * metrics.scale)}px`,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: `${Math.round(metrics.metaSize * 0.88)}px`,
            lineHeight: 1,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "rgba(255, 247, 227, 0.68)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: `${metrics.bodySize}px`,
            lineHeight: 1.08,
            color: "#fff7e3",
          }}
        >
          {primary}
        </span>
        {secondary ? (
          <span
            style={{
              fontSize: `${metrics.metaSize}px`,
              lineHeight: 1,
              color: "rgba(242, 251, 255, 0.72)",
            }}
          >
            {secondary}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function formatRequirementPrimary(quest) {
  const objective = getPrimaryObjective(quest)
  if (!objective) return "Quest details soon"

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

function formatRequirementSecondary(quest) {
  const objective = getPrimaryObjective(quest)
  if (!objective) return ""
  return `${objective.current}/${objective.target}`
}

function formatRewardPrimary(quest) {
  const reward = getPrimaryReward(quest)
  if (!reward) return "Reward pending"

  if (reward.type === QUEST_REWARD_TYPES.INVENTORY_CAPACITY) {
    return `Slots +${Math.max(0, Number(reward.amount) || 0)}`
  }

  if (reward.type === QUEST_REWARD_TYPES.ITEM) {
    return `${getItemLabel(reward.value)} x${Math.max(0, Number(reward.amount) || 0)}`
  }

  return `${reward.type}`
}

function getCardVisualState(quest, isActive) {
  if (!quest) {
    return {
      opacity: 0.7,
      filter: "grayscale(0.2) brightness(0.92)",
      boxShadow: "0 20px 28px rgba(0,0,0,0.28)",
    }
  }

  if (quest.rewardClaimed || quest.status === "claimed") {
    return {
      opacity: 0.46,
      filter: "grayscale(0.42) saturate(0.7) brightness(0.9)",
      boxShadow: "0 16px 26px rgba(0,0,0,0.22)",
    }
  }

  if (quest.status === "locked") {
    return {
      opacity: 0.58,
      filter: "grayscale(0.32) saturate(0.78) brightness(0.88)",
      boxShadow: "0 16px 24px rgba(0,0,0,0.22)",
    }
  }

  if (isActive) {
    return {
      opacity: 1,
      filter: "brightness(1.02) saturate(1.02)",
      boxShadow: "0 26px 42px rgba(0,0,0,0.42)",
    }
  }

  return {
    opacity: 0.9,
    filter: "brightness(0.98)",
    boxShadow: "0 18px 30px rgba(0,0,0,0.28)",
  }
}

function CardSection({ metrics, children }) {
  return (
    <div
      style={{
        borderRadius: 0,
        padding: `${metrics.framePaddingY}px ${metrics.framePaddingX}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: `${roundMetric(16 * metrics.scale)}px`,
        minHeight: 0,
        width: "100%",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  )
}

export default function QuestCard({
  quest,
  scale,
  isActive,
  isSelectable,
  onSelect,
  ariaLabel,
}) {
  const metrics = useMemo(() => getQuestCardMetrics(scale), [scale])
  const visualState = useMemo(() => getCardVisualState(quest, isActive), [isActive, quest])
  const iconData = getQuestIconData(quest)
  const objective = getPrimaryObjective(quest)
  const reward = getPrimaryReward(quest)
  const requirementIconData = getItemIconData(objective?.itemId || iconData.itemId, "Requirement")
  const rewardIconData = getItemIconData(reward?.value || iconData.itemId, "Reward")
  const requirementPrimary = formatRequirementPrimary(quest)
  const requirementSecondary = formatRequirementSecondary(quest)
  const rewardPrimary = formatRewardPrimary(quest)

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isActive}
      disabled={!isSelectable}
      onClick={() => {
        if (!isSelectable) return
        onSelect?.()
      }}
      style={{
        width: `${metrics.width}px`,
        height: `${metrics.height}px`,
        padding: `${metrics.paddingY}px ${metrics.paddingX}px`,
        boxSizing: "border-box",
        border: "none",
        borderRadius: 0,
        backgroundColor: "transparent",
        backgroundImage:
          `linear-gradient(180deg, rgba(9, 7, 7, 0.18) 0%, rgba(9, 7, 7, 0.24) 100%), url(${questCardBackground})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#fff7e3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: `${metrics.sectionGap}px`,
        textAlign: "center",
        cursor: isSelectable ? "pointer" : "default",
        opacity: visualState.opacity,
        filter: visualState.filter,
        boxShadow: visualState.boxShadow,
        appearance: "none",
        WebkitAppearance: "none",
        transform: "translateZ(0)",
        transition: "width 180ms ease, height 180ms ease, opacity 180ms ease, filter 180ms ease",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateRows: "0.95fr 0.72fr 1fr 1fr",
          gap: `${metrics.sectionGap}px`,
          flex: 1,
          minHeight: 0,
          width: "100%",
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        <CardSection metrics={metrics}>
          <div
            style={{
              width: `${Math.round(150 * metrics.scale)}px`,
              height: `${Math.round(150 * metrics.scale)}px`,
              aspectRatio: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.25)",
              boxSizing: "border-box",
            }}
          >
            <QuestItemIcon iconData={iconData} metrics={metrics} />
          </div>
        </CardSection>

        <CardSection metrics={metrics}>
          <span
            style={{
              fontSize: `${metrics.titleSize}px`,
              lineHeight: 1.02,
              color: "#fff7e5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {quest?.title || "Quest"}
          </span>
        </CardSection>

        <CardSection metrics={metrics}>
          <ItemInfoBlock
            metrics={metrics}
            label="Requirements"
            primary={requirementPrimary}
            secondary={requirementSecondary}
            iconData={requirementIconData}
          />
        </CardSection>

        <CardSection metrics={metrics}>
          <ItemInfoBlock
            metrics={metrics}
            label="Reward"
            primary={rewardPrimary}
            secondary=""
            iconData={rewardIconData}
          />
        </CardSection>
      </div>
    </button>
  )
}
