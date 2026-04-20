import { create } from "zustand";

export const createEntitySlice = (set) => ({
  entities: [
    { id: 1, x: 100, y: 0, type: "food", active: true },
    { id: 2, x: -150, y: 50, type: "food", active: true },
    { id: 3, x: 200, y: -100, type: "food", active: true },
  ],

  spawnEntity: (x, y, type = "food") =>
    set((state) => {
      const jitter = () => (Math.random() - 0.5) * 60;

      return {
        entities: [
          ...state.entities,
          {
            id: `${Date.now()}-${Math.random()}`,
            x: x + jitter(),
            y: y + jitter(),
            type,
            active: true,
          },
        ],
      };
    }),
  addEntity: (entity) =>
    set((state) => ({
      entities: [...state.entities, entity],
    })),

  removeEntity: (entityId) =>
    set((state) => ({
      entities: state.entities.filter((entity) => entity.id !== entityId),
    })),

  updateEntity: (entityId, updates) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity.id === entityId
          ? {
              ...entity,
              ...(typeof updates === "function" ? updates(entity) : updates),
            }
          : entity
      ),
    })),
});

export const useEntityStore = create((set) => ({
  ...createEntitySlice(set),
}));
