import React from "react"
import {
  countItemsInSlots,
  getRecipeAvailability,
  getRecipeOutputs,
  getVisibleCraftRecipes,
} from "../config/craftRecipes"
import { getItemDefinition } from "../config/itemsRegistry"
import ItemVisual from "./ItemVisual"

function humanizeItemId(itemId) {
  return itemId
    ?.split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getItemLabel(itemId) {
  return getItemDefinition(itemId)?.name || humanizeItemId(itemId) || "Unknown Item"
}

function getRecipeIcon(recipe) {
  const primaryOutputId = getRecipeOutputs(recipe)[0]?.itemId
  if (primaryOutputId) {
    return <ItemVisual itemId={primaryOutputId} size={20} emojiSize={18} />
  }

  return (
    <span
      aria-hidden="true"
      style={{
        fontSize: "18px",
        lineHeight: 1,
        display: "block",
      }}
    >
      {recipe?.icon || "🧰"}
    </span>
  )
}

function renderOutputLabel(output) {
  if (!output?.itemId) return "Unknown Output"
  return `${getItemLabel(output.itemId)} x${Math.max(0, Number(output.quantity) || 0)}`
}

export default function RecipePanel({
  mainSlots = [],
  usableSlots = [],
  onCraftRecipe,
}) {
  const visibleRecipes = getVisibleCraftRecipes()
  const inventoryCounts = countItemsInSlots([...(mainSlots || []), ...(usableSlots || [])])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <strong
          style={{
            fontSize: "12px",
            letterSpacing: "0.08em",
            color: "#fff3c6",
          }}
        >
          Recipes
        </strong>
        <span
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.56)",
          }}
        >
          {visibleRecipes.length} unlocked
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          overflowY: "auto",
          paddingRight: "2px",
          minHeight: 0,
        }}
      >
        {visibleRecipes.map((recipe) => {
          const availability = getRecipeAvailability(recipe, inventoryCounts)
          const outputs = getRecipeOutputs(recipe)
          const canCraft = availability.canCraft && typeof onCraftRecipe === "function"

          return (
            <section
              key={recipe.id}
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: canCraft ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                padding: "10px",
                boxShadow: canCraft ? "0 0 0 1px rgba(255, 227, 130, 0.1) inset" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.3)",
                      flex: "0 0 auto",
                    }}
                  >
                    {getRecipeIcon(recipe)}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#fff",
                        textTransform: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {recipe.name}
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {recipe.category}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCraftRecipe?.(recipe.id)}
                  disabled={!canCraft}
                  style={{
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: "8px",
                    background: canCraft ? "rgba(255, 227, 130, 0.18)" : "rgba(255,255,255,0.06)",
                    color: canCraft ? "#fff5d6" : "rgba(255,255,255,0.4)",
                    padding: "6px 8px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    cursor: canCraft ? "pointer" : "not-allowed",
                    flex: "0 0 auto",
                  }}
                >
                  {typeof onCraftRecipe === "function" ? "Craft" : "Soon"}
                </button>
              </div>

              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {availability.inputs.map((input) => (
                  <div
                    key={`${recipe.id}:${input.itemId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      fontSize: "10px",
                      textTransform: "none",
                      color: input.fulfilled ? "rgba(255,255,255,0.82)" : "#ffb3b3",
                    }}
                  >
                    <span>{getItemLabel(input.itemId)}</span>
                    <span>
                      {input.owned}/{input.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                {outputs.map((output, index) => (
                  <div
                    key={`${recipe.id}:output:${output.itemId}:${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.86)",
                      textTransform: "none",
                    }}
                  >
                    <ItemVisual itemId={output.itemId} size={16} emojiSize={14} />
                    <span>{renderOutputLabel(output)}</span>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
