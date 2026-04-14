import React, { useState } from "react"

export default function PanelItem({ label, selected = false, onClick }) {
  const [pressed, setPressed] = useState(false)
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
    transition: "transform 0.1s ease"
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
    </div>
  )
}