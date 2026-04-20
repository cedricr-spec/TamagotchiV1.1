import React, { useState, useEffect, useRef } from "react";
import CTA_ROUNDED from "../../GameActions/CTA_rounded_Game_Action.webp";
import CTA_DISABLED from "../../GameActions/CTA_rounded_Game_Action_Disabled.webp";
import CTA_PRESSED from "../../GameActions/CTA_rounded_Game_Action_Pressed.webp";
import { usePetStore as useStore } from "../store/usePetstore";
import { ACTIONS } from "../../game/actions";

// persistent cooldowns
const globalCooldowns = {};

export default function LineMenu() {
  const applyAction = useStore((s) => s.applyAction);
  const getState = useStore.getState;

  const cooldownsRef = useRef(globalCooldowns);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(v => v + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const items = ACTIONS.slice(0, 10);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px",
        padding: "10px 16px",
        width: "min(95vw, 900px)",
        pointerEvents: "auto"
      }}
    >
      {items.map((item, i) => {
        const now = Date.now();

        const isDisabled =
          (cooldownsRef.current[`${item.id}_${i}`] && cooldownsRef.current[`${item.id}_${i}`] > now) ||
          (item.condition && !item.condition(getState()));

        return (
          <div
            key={i}
            style={{
              width: "64px",
              height: "64px",
              position: "relative",
              pointerEvents: "auto"
            }}
          >
            <div
              onClick={() => {
                const now = Date.now();
                const state = getState();

                if (item.condition && !item.condition(state)) return;
                if (cooldownsRef.current[`${item.id}_${i}`] && cooldownsRef.current[`${item.id}_${i}`] > now) return;

                applyAction && applyAction(item);

                cooldownsRef.current[`${item.id}_${i}`] = now + item.cooldown * 1000;
                forceUpdate(v => v + 1);
              }}
              onMouseEnter={(e) => {
                if (isDisabled) return;
                e.currentTarget.dataset.hover = "true";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.dataset.hover = "false";
                e.currentTarget.dataset.pressed = "false";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseDown={(e) => {
                if (isDisabled) return;
                e.currentTarget.dataset.pressed = "true";
                e.currentTarget.style.transform = "scale(0.92)";
              }}
              onMouseUp={(e) => {
                if (isDisabled) return;
                e.currentTarget.dataset.pressed = "false";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: `url(${CTA_ROUNDED})`,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                cursor: isDisabled ? "default" : "pointer",
                transition: "transform 0.2s ease",
                position: "relative"
              }}
              ref={(el) => {
                if (!el) return;

                const now = Date.now();
                const disabled =
                  (cooldownsRef.current[`${item.id}_${i}`] && cooldownsRef.current[`${item.id}_${i}`] > now) ||
                  (item.condition && !item.condition(getState()));

                if (disabled) {
                  el.style.backgroundImage = `url(${CTA_DISABLED})`;
                  return;
                }

                const pressed = el.dataset.pressed === "true";
                const hover = el.dataset.hover === "true";

                if (pressed) {
                  el.style.backgroundImage = `url(${CTA_PRESSED})`;
                } else {
                  el.style.backgroundImage = `url(${CTA_ROUNDED})`;
                }
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isDisabled ? 0.4 : 1,
                  filter: isDisabled ? "grayscale(1)" : "none"
                }}
              >
                <span>{item.icon || "❓"}</span>
              </div>

              {/* cooldown text */}
              {cooldownsRef.current[`${item.id}_${i}`] && cooldownsRef.current[`${item.id}_${i}`] > Date.now() && (
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#fff",
                    fontWeight: 600,
                    pointerEvents: "none"
                  }}
                >
                  {Math.ceil((cooldownsRef.current[`${item.id}_${i}`] - Date.now()) / 1000)}
                </span>
              )}

              {/* radial cooldown */}
              {cooldownsRef.current[`${item.id}_${i}`] && cooldownsRef.current[`${item.id}_${i}`] > Date.now() && (
                <div
                  style={{
                    position: "absolute",
                    inset: 6,
                    borderRadius: "50%",
                    background: `conic-gradient(rgba(255,255,255,0.25) ${(1 - (cooldownsRef.current[`${item.id}_${i}`] - Date.now()) / (item.cooldown * 1000)) * 360}deg, transparent 0deg)`
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}