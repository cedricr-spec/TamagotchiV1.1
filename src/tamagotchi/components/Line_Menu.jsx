import React, { useState, useEffect, useRef } from "react";
import CTA_DEFAULT from "../../hud/CTAs/CTA_Small_8BIT.png";
import CTA_PRESSED from "../../hud/CTAs/CTA_Small_8BIT_Pressed.png";
import { usePetStore as useStore } from "../store/usePetstore";
import { ACTIONS } from "../../game/actions";

// persistent cooldowns
const globalCooldowns = {};

export default function LineMenu({ onHover }) {
  const applyAction = useStore((s) => s.applyAction);
  const theme = useStore((s) => s.theme);
  const color = theme?.modelColor || "#8f8f8f";
  const getState = useStore.getState;

  const cooldownsRef = useRef(globalCooldowns);
  const [, forceUpdate] = useState(0);
  const [pressedKey, setPressedKey] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(v => v + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const items = ACTIONS.slice(0, 5);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "12px",
        padding: "8px 12px",
        width: "min(95vw, 520px)",
        pointerEvents: "auto"
      }}
    >
      {items.map((item, i) => {
        const now = Date.now();
        const buttonKey = `${item.id}_${i}`;
        const isPressed = pressedKey === buttonKey;
        const ctaImage = isPressed ? CTA_PRESSED : CTA_DEFAULT;
        const state = getState();
        const charges = item.chargesKey ? (state[item.chargesKey] ?? 0) : null;

        const isDisabled =
          (cooldownsRef.current[buttonKey] && cooldownsRef.current[buttonKey] > now) ||
          (item.condition && !item.condition(state)) ||
          (item.chargesKey ? charges <= 0 : false);

        return (
          <div
            key={i}
            style={{
              width: "52px",
              height: "52px",
              position: "relative",
              pointerEvents: "auto"
            }}
          >
            <div
              onClick={() => {
                const now = Date.now();
                const state = getState();

                if (item.condition && !item.condition(state)) return;
                if (cooldownsRef.current[buttonKey] && cooldownsRef.current[buttonKey] > now) return;

                applyAction && applyAction(item);

                if (item.chargesKey) {
                  useStore.setState((prev) => ({
                    [item.chargesKey]: Math.max(0, (prev[item.chargesKey] ?? 0) - 1),
                  }));
                }

                cooldownsRef.current[buttonKey] = now + item.cooldown * 1000;
                forceUpdate(v => v + 1);
              }}
              onMouseEnter={() => {
                if (isDisabled) return;
                onHover && onHover(item);
              }}
              onMouseLeave={() => {
                onHover && onHover(null);
                setPressedKey(null);
              }}
              onMouseDown={() => {
                if (isDisabled) return;
                setPressedKey(buttonKey);
              }}
              onMouseUp={() => {
                if (isDisabled) return;
                setPressedKey(null);
              }}
              onTouchStart={(e) => {
                if (isDisabled) return;
                e.preventDefault();
                setPressedKey(buttonKey);
              }}
              onTouchEnd={() => {
                if (isDisabled) return;
                setPressedKey(null);
              }}
              onTouchCancel={() => {
                setPressedKey(null);
              }}
              style={{
                cursor: isDisabled ? "default" : "pointer",
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden"
              }}
            >
              <img
                src={ctaImage}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  imageRendering: "pixelated",
                  display: "block",
                  opacity: isDisabled ? 0.55 : 1,
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: color,
                  mixBlendMode: "color",
                  pointerEvents: "none",
                  opacity: isDisabled ? 0.55 : 1,
                  WebkitMaskImage: `url(${ctaImage})`,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskImage: `url(${ctaImage})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                }}
              />

              <div
                style={{
                  width: "100%",
                  height: "100%",
                  paddingTop: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isDisabled ? 0.4 : 1,
                  filter: isDisabled ? "grayscale(1)" : "none",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span style={{ fontSize: "20px", lineHeight: 1 }}>{item.icon || "❓"}</span>
              </div>

              {/* cooldown text */}
              {cooldownsRef.current[buttonKey] && cooldownsRef.current[buttonKey] > Date.now() && (
                <span
                  style={{
                    position: "absolute",
                    top: "38%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "14px",
                    textShadow: "0 1px 2px rgba(0,0,0,0.7)",
                    pointerEvents: "none"
                  }}
                >
                  {Math.ceil((cooldownsRef.current[buttonKey] - Date.now()) / 1000)}
                </span>
              )}

              {charges !== null && (
                <span
                  style={{
                    position: "absolute",
                    right: "6px",
                    bottom: "6px",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#fff",
                    background: "rgba(0,0,0,0.55)",
                    borderRadius: "4px",
                    textShadow: "0 1px 2px rgba(0,0,0,0.7)",
                    pointerEvents: "none",
                  }}
                >
                  {charges}
                </span>
              )}

              {/* radial cooldown */}
              {cooldownsRef.current[buttonKey] && cooldownsRef.current[buttonKey] > Date.now() && (
                <div
                  style={{
                    position: "absolute",
                    inset: 4,
                    borderRadius: "8px",
                    background: `conic-gradient(rgba(255,255,255,0.25) ${(1 - (cooldownsRef.current[buttonKey] - Date.now()) / (item.cooldown * 1000)) * 360}deg, transparent 0deg)`
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