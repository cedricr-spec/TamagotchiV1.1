import { create } from "zustand"

export const usePetStore = create((set) => ({
  hunger: 50,
  energy: 50,
  happiness: 50,

  petColor: "#ffe11b",
  setPetColor: (color) => set({ petColor: color }),

  modelColor: "#ffffff",
  setModelColor: (color) => set({ modelColor: color }),

  feed: () =>
    set((state) => ({
      hunger: Math.min(state.hunger + 10, 100)
    })),

  play: () =>
    set((state) => ({
      happiness: Math.min(state.happiness + 10, 100),
      energy: Math.max(state.energy - 5, 0)
    })),

  sleep: () =>
    set((state) => ({
      energy: Math.min(state.energy + 15, 100)
    })),

  tick: () =>
    set((state) => ({
      hunger: Math.max(state.hunger - 1, 0),
      energy: Math.max(state.energy - 0.5, 0),
      happiness: Math.max(state.happiness - 0.5, 0)
    }))
}))