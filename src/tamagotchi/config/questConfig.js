import RAW_QUESTS_JSON from "./quests.json"

export const QUEST_OBJECTIVE_TYPES = {
  COLLECT_ITEM: "collect_item",
  CRAFT_ITEM: "craft_item",
  DISCARD_ITEM: "discard_item",
  MINE_OBJECT: "mine_object",
  CHOP_OBJECT: "chop_object",
  WORLD_INTERACTION: "world_interaction",
}

export const QUEST_REWARD_TYPES = {
  INVENTORY_CAPACITY: "inventory_capacity",
  ITEM: "item",
  UNLOCK_CHARACTER: "unlock_character",
  UNLOCK_RECIPE: "unlock_recipe",
  EXPERIENCE: "experience",
  CURRENCY: "currency",
}

// Maps lowercase JSON strings → canonical constant values
const OBJECTIVE_TYPE_MAP = {
  collect_item: QUEST_OBJECTIVE_TYPES.COLLECT_ITEM,
  craft_item: QUEST_OBJECTIVE_TYPES.CRAFT_ITEM,
  discard_item: QUEST_OBJECTIVE_TYPES.DISCARD_ITEM,
  mine_object: QUEST_OBJECTIVE_TYPES.MINE_OBJECT,
  chop_object: QUEST_OBJECTIVE_TYPES.CHOP_OBJECT,
  world_interaction: QUEST_OBJECTIVE_TYPES.WORLD_INTERACTION,
}

const REWARD_TYPE_MAP = {
  item: QUEST_REWARD_TYPES.ITEM,
  inventory_capacity: QUEST_REWARD_TYPES.INVENTORY_CAPACITY,
  unlock_character: QUEST_REWARD_TYPES.UNLOCK_CHARACTER,
  unlock_recipe: QUEST_REWARD_TYPES.UNLOCK_RECIPE,
  experience: QUEST_REWARD_TYPES.EXPERIENCE,
  currency: QUEST_REWARD_TYPES.CURRENCY,
}

function normalizeObjectiveType(rawType) {
  if (!rawType) return QUEST_OBJECTIVE_TYPES.COLLECT_ITEM
  const lower = String(rawType).toLowerCase().trim()
  return OBJECTIVE_TYPE_MAP[lower] || lower
}

function normalizeRewardType(rawType) {
  if (!rawType) return QUEST_REWARD_TYPES.ITEM
  const lower = String(rawType).toLowerCase().trim()
  return REWARD_TYPE_MAP[lower] || lower
}

function normalizeQuantity(value, fallback = 1) {
  const n = Math.max(0, Number(value) || fallback)
  return n > 0 ? n : fallback
}

function normalizeQuest(quest) {
  if (!quest?.id) {
    if (import.meta.env.DEV) {
      console.warn("[questConfig] Quest entry missing id:", quest)
    }
    return null
  }

  // Support both `prerequisites` (JSON schema) and `prerequisiteQuestIds` (legacy JS)
  const rawPrereqs = Array.isArray(quest.prerequisites)
    ? quest.prerequisites
    : Array.isArray(quest.prerequisiteQuestIds)
    ? quest.prerequisiteQuestIds
    : []
  const prerequisiteQuestIds = [...new Set(rawPrereqs.filter(Boolean))]

  const objectives = Array.isArray(quest.objectives)
    ? quest.objectives
        .map((obj, idx) => {
          const itemId = obj?.itemId || null
          if (import.meta.env.DEV && !itemId) {
            console.warn(`[questConfig] Quest "${quest.id}" objective[${idx}] missing itemId`)
          }
          return {
            type: normalizeObjectiveType(obj?.type),
            itemId,
            // Support both `target` (spec shape) and `quantity` (legacy)
            quantity: normalizeQuantity(obj?.target ?? obj?.quantity, 1),
          }
        })
        .filter((obj) => Boolean(obj.itemId))
    : []

  const rewards = Array.isArray(quest.rewards)
    ? quest.rewards
        .map((reward) => ({
          type: normalizeRewardType(reward?.type),
          value: reward?.value ?? null,
          amount: normalizeQuantity(reward?.amount, 1),
        }))
        .filter((reward) => Boolean(reward.type) && reward.value !== null)
    : []

  if (import.meta.env.DEV && objectives.length === 0) {
    console.warn(`[questConfig] Quest "${quest.id}" has no valid objectives`)
  }

  return {
    id: quest.id,
    chapter: Math.max(1, Number(quest.chapter) || 1),
    order: Math.max(0, Number(quest.order) || 0),
    title: quest.title || quest.id,
    shortTitle: quest.shortTitle || quest.title || quest.id,
    description: quest.description || "",
    iconItemId: quest.iconItemId || null,
    category: quest.category || "general",
    hidden: quest.hidden === true,
    status: "locked",
    // A quest with no prerequisites is automatically unlocked by default
    unlockedByDefault: quest.unlockedByDefault === true || prerequisiteQuestIds.length === 0,
    prerequisiteQuestIds,
    repeatable: quest.repeatable === true,
    objectives,
    rewards,
  }
}

// All quests loaded from JSON, normalized, sorted by chapter then order
export const QUESTS = RAW_QUESTS_JSON.map(normalizeQuest)
  .filter(Boolean)
  .sort((a, b) => {
    if (a.chapter !== b.chapter) return a.chapter - b.chapter
    return a.order - b.order
  })

export const QUESTS_BY_ID = QUESTS.reduce((registry, quest) => {
  registry[quest.id] = quest
  return registry
}, {})

// Ordered list of quest IDs (chapter → order) — used by the store for active quest resolution
export const QUEST_CHAIN_ORDER = QUESTS.map((q) => q.id)

export const DEFAULT_UNLOCKED_QUEST_IDS = QUESTS
  .filter((q) => q.unlockedByDefault)
  .map((q) => q.id)

export const QUEST_DEPENDENTS_BY_ID = QUESTS.reduce((dependents, quest) => {
  quest.prerequisiteQuestIds.forEach((prereqId) => {
    if (!dependents[prereqId]) dependents[prereqId] = []
    dependents[prereqId].push(quest.id)
  })
  return dependents
}, {})

export function getQuestById(questId) {
  return QUESTS_BY_ID[questId] || null
}

export function getQuestObjectives(questIdOrQuest) {
  const quest = typeof questIdOrQuest === "string" ? getQuestById(questIdOrQuest) : questIdOrQuest
  return quest?.objectives || []
}

export function getQuestRewards(questIdOrQuest) {
  const quest = typeof questIdOrQuest === "string" ? getQuestById(questIdOrQuest) : questIdOrQuest
  return quest?.rewards || []
}
