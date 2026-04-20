import { defaultTheme } from "../../theme"
import { create } from "zustand"

export const usePetStore = create((set, get) => ({
  hunger: 50,
  energy: 50,
  happiness: 50,
  health: 100,
  _gameInterval: null,
  _lastAction: 0,

  theme: defaultTheme,

  debugUI: true,

  debugColors: {
    layout: "rgba(255,0,0,0.25)",
    content: "rgba(0,255,0,0.25)",
    overlay: "rgba(0,0,255,0.25)",
    text: "rgba(255,255,0,0.25)",
  },

  toggleDebugUI: () =>
    set((state) => ({
      debugUI: !state.debugUI
    })),

  getDebugColor: (layer) => {
    const colors = get().debugColors;
    return colors[layer] || "rgba(255,255,255,0.2)";
  },

  setPetColor: (color) =>
    set((state) => ({
      theme: {
        ...state.theme,
        petColor: color
      }
    })),

  setModelColor: (color) =>
    set((state) => ({
      theme: {
        ...state.theme,
        modelColor: color
      }
    })),

  setTheme: (update) =>
    set((state) => ({
      theme:
        typeof update === "function"
          ? update(state.theme)
          : {
              ...state.theme,
              ...update
            }
    })),

  canAct: () => {
    const now = Date.now();
    const last = get()._lastAction;
    return now - last > 800;
  },

  setActionTime: () => set({ _lastAction: Date.now() }),

  feed: () => {
    if (!get().canAct()) return;
    get().setActionTime();

    set((state) => ({
      hunger: Math.min(state.hunger + 20, 100),
      happiness: Math.min(state.happiness + 5, 100)
    }));
  },

  play: () => {
    if (!get().canAct()) return;
    get().setActionTime();

    set((state) => ({
      happiness: Math.min(state.happiness + 15, 100),
      energy: Math.max(state.energy - 10, 0),
      hunger: Math.max(state.hunger - 5, 0)
    }));
  },

  sleep: () => {
    if (!get().canAct()) return;
    get().setActionTime();

    set((state) => ({
      energy: Math.min(state.energy + 25, 100),
      hunger: Math.max(state.hunger - 5, 0)
    }));
  },

  applyAction: (action) => {
    if (!get().canAct()) return;
    get().setActionTime();

    set((state) => ({
      hunger: Math.min(100, Math.max(0, state.hunger + (action.effects?.hunger || 0))),
      energy: Math.min(100, Math.max(0, state.energy + (action.effects?.energy || 0))),
      happiness: Math.min(100, Math.max(0, state.happiness + (action.effects?.happiness || 0))),
      health: Math.min(100, Math.max(0, state.health + (action.effects?.health || 0))),
    }));
  },

  tick: () =>
    set((state) => ({
      hunger: Math.max(state.hunger - 1, 0),
      energy: Math.max(state.energy - 0.5, 0),
      happiness: Math.max(state.happiness - 0.5, 0)
    })),

  startGame: () => {
    if (get()._gameInterval) return;

    const id = setInterval(() => {
      // base decay
      get().tick();

      const { hunger, energy, happiness, health } = get();
      const lowCount = [hunger, energy, happiness].filter(v => v < 40).length;

      if (lowCount > 0) {
        set({
          health: Math.max(0, health - 0.5 * lowCount)
        });
      }
    }, 1000);

    set({ _gameInterval: id });
  },

  stopGame: () => {
    const id = get()._gameInterval;
    if (id) {
      clearInterval(id);
      set({ _gameInterval: null });
    }
  },
}))