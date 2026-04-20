import React from "react";
import { useWorldStore } from "../store/worldSlice";

const STEP = 32;

export default function PetControls() {
  const moveWorld = useWorldStore((state) => state.moveWorld);

  return (
    <div data-pet-controls>
      <button type="button" onClick={() => moveWorld(0, STEP)}>
        up
      </button>
      <button type="button" onClick={() => moveWorld(0, -STEP)}>
        down
      </button>
      <button type="button" onClick={() => moveWorld(STEP, 0)}>
        left
      </button>
      <button type="button" onClick={() => moveWorld(-STEP, 0)}>
        right
      </button>
    </div>
  );
}
