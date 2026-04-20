import { create } from "zustand";

export const createWorldSlice = (set) => ({
  worldOffset: { x: 0, y: 0 },

  moveWorld: (dx, dy) =>
    set((state) => ({
      worldOffset: {
        x: state.worldOffset.x + dx,
        y: state.worldOffset.y + dy,
      },
    })),
});

export const useWorldStore = create((set) => ({
  ...createWorldSlice(set),
}));
