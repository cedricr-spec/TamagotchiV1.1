import React, { useState } from "react"
import { usePetStore } from "../tamagotchi/store/usePetstore"

export default function PanelItem({ label, selected = false, onClick }) {
  const [pressed, setPressed] = useState(false)
  const debugUI = usePetStore((s) => s.debugUI)
  const bg = selected
    ? "/CTA_item_panel_selected.svg"
    : "/CTA_item_panel_unselected.svg"

  return (
    <div
  onClick={onClick}
  onMouseDown={() => setPressed(true)}
  onMouseUp={() => setPressed(false)}
  onMouseLeave={() => setPressed(false)}
  style={{
    position: "relative",
    width: "100%",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transform: pressed ? "scale(0.97)" : "scale(1)",
    transition: "transform 0.1s ease",
    outline: debugUI ? "2px solid red" : "none",
  }}
>
      {/* BACKGROUND SVG */}
      <img
  src={bg}
  style={{
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    top: 0,
    left: 0,
    pointerEvents: "none"
  }}
/>

      {/* TEXT */}
      <div
  className="no-select"
  style={{
    position: "relative",
    color: "white",
    fontSize: "16px",
    fontWeight: 500,
    pointerEvents: "none",
    textAlign: "center",
    width: "100%",
  }}
>
  {label}
</div>
    {debugUI && (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 10
    }}
  >
    <div style={{ position: "absolute", inset: 0, background: "rgba(255,0,0,0.2)" }} />
    <div style={{ position: "absolute", left: "10%", right: "10%", top: "20%", bottom: "20%", background: "rgba(0,255,0,0.2)" }} />
  </div>
)}
</div>
  )
}
