import { useCharacterStore } from "./useCharacterStore";
import { usePetStore } from "./usePetstore";
import { create } from "zustand";
import {
  DEFAULT_WORLD_THEME,
  isWorldThemeAvailable,
} from "../config/worldThemeConfig";

let worldMovementResolver = null;

export function setWorldMovementResolver(resolver) {
  worldMovementResolver = typeof resolver === "function" ? resolver : null;
}

function resolveWorldMovement(state, dx, dy) {
  if (!worldMovementResolver) {
    return { dx, dy };
  }

  const resolved = worldMovementResolver({
    worldOffset: state.worldOffset,
    dx,
    dy,
  });

  return {
    dx: Number.isFinite(resolved?.dx) ? resolved.dx : dx,
    dy: Number.isFinite(resolved?.dy) ? resolved.dy : dy,
  };
}

export const createWorldSlice = (set) => ({
  worldOffset: { x: 0, y: 0 },
  lastMoveAt: 0,
  facingDirection: "right",
  currentWorldTheme: DEFAULT_WORLD_THEME,

  setWorldTheme: (themeId) => {
    set({
      currentWorldTheme: isWorldThemeAvailable(themeId)
        ? themeId
        : DEFAULT_WORLD_THEME,
    });
  },

  moveWorld: (dx, dy) => {
    const { health } = usePetStore.getState();
    const { persistentState, transientState } = useCharacterStore.getState();
    const isDead =
      health <= 0 ||
      transientState === "death" ||
      persistentState === "dead";

    if (isDead || (dx === 0 && dy === 0)) return;

    set((state) => {
      const movement = resolveWorldMovement(state, dx, dy);
      const nextDx = movement.dx;
      const nextDy = movement.dy;

      return {
        worldOffset: {
          x: state.worldOffset.x + nextDx,
          y: state.worldOffset.y + nextDy,
        },
        lastMoveAt: Date.now(),
        facingDirection:
          dx > 0 ? "left" : dx < 0 ? "right" : state.facingDirection,
      };
    });
  },
});

export const useWorldStore = create((set) => ({
  ...createWorldSlice(set),
}));