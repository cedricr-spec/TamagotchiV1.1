import { create } from "zustand";

export const createEntitySlice = (set) => ({
  entities: [],

  spawnEntity: (x, y, type = "food") =>
    set((state) => {
      const jitter = type === "decor" ? () => 0 : () => (Math.random() - 0.5) * 60;

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
  spawnDecorEntity: (x, y, sprite, scale = 1) =>
    set((state) => ({
      entities: [
        ...state.entities,
        {
          id: `decor-${Date.now()}-${Math.random()}`,
          x,
          y,
          type: "decor",
          sprite,
          scale,
          active: true,
          persistent: true,
        },
      ],
    })),
  addEntity: (entity) =>
    set((state) => ({
      entities: [...state.entities, entity],
    })),

  removeEntity: (entityId) =>
    set((state) => ({
      entities: state.entities.filter((entity) => entity.id !== entityId),
    })),

  clearNonPersistent: () =>
    set((state) => ({
      entities: state.entities.filter((e) => e.persistent),
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
