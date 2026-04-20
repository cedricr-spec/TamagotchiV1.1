import { useEffect } from "react";
import { useWorldStore } from "../store/worldSlice";
import { getTreesAround, DECOR_CONFIG } from "../utils/decorGenerator";

const DEBUG_HITBOX = true;

export default function CollisionSystem() {
  useEffect(() => {
    const unsubscribe = useWorldStore.subscribe((state, prevState) => {
      const worldOffset = state.worldOffset;
      const prevOffset = prevState.worldOffset;

      const dx = worldOffset.x - prevOffset.x;
      const dy = worldOffset.y - prevOffset.y;

      if (dx === 0 && dy === 0) return;

      const pet = {
        x: -worldOffset.x,
        y: -worldOffset.y,
      };

      // ⚠️ CRITICAL: must stay perfectly in sync with DecorLayer
      // same coordinate system (world centered) + same DECOR_CONFIG
      const trees = getTreesAround(pet.x, pet.y, DECOR_CONFIG);

      if (DEBUG_HITBOX) {
        const debugLayer = document.getElementById("collision-debug-layer");
        if (debugLayer) debugLayer.innerHTML = "";
      }

      let colliding = false;

      for (const tree of trees) {
        // 🌳 full sprite collision (except top canopy)
        const padding = 1;

        const halfWidth = tree.width / 2 + padding;

        // 🔥 FIX: tree position behaves like CENTER in practice
        const baseX = tree.x;

        // Deleted unused variables:
        // const baseY = tree.y - tree.height / 2 + offsetY;
        // const halfHeight = tree.height / 2;

        // 👉 trunk = lower part of sprite
        const collisionTop = tree.y - tree.height * 0.4;
        const collisionBottom = tree.y + padding;

        const hitX = pet.x >= baseX - halfWidth && pet.x <= baseX + halfWidth;
        const hitY = pet.y >= collisionTop && pet.y <= collisionBottom;

        // 🔴 DEBUG HITBOX VISUAL
        if (DEBUG_HITBOX) {
          let debugLayer = document.getElementById("collision-debug-layer");
          if (!debugLayer) {
            debugLayer = document.createElement("div");
            debugLayer.id = "collision-debug-layer";
            debugLayer.style.position = "fixed";
            debugLayer.style.inset = "0";
            debugLayer.style.pointerEvents = "none";
            debugLayer.style.zIndex = "9999";
            document.body.appendChild(debugLayer);
          }

          const el = document.createElement("div");
          el.style.position = "absolute";
          el.style.border = "1px solid red";

          // ⚠️ use DecorLayer container center (NOT window) to avoid offset drift
          const container = document.querySelector("[data-decor-layer]");
          const rect = container?.getBoundingClientRect();

          const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
          const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

          const screenLeft = centerX + baseX + worldOffset.x - halfWidth;
          const screenTop = centerY + collisionTop + worldOffset.y;

          el.style.left = `${screenLeft}px`;
          el.style.top = `${screenTop}px`;
          el.style.width = `${halfWidth * 2}px`;
          el.style.height = `${collisionBottom - collisionTop}px`;

          debugLayer.appendChild(el);
        }

        if (hitX && hitY) {
          colliding = true;
          break;
        }
      }

      if (colliding) {
        useWorldStore.setState({
          worldOffset: prevOffset,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}