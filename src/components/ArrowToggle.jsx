import React, { useState } from "react"

export default function ArrowToggle({ open, onClick }) {
  const [hover, setHover] = useState(false)

  // 👉 fermé = arrow right / ouvert = arrow left
  const src = open
    ? (hover ? "/CTA_arrow_right_hover.svg" : "/CTA_arrow_right.svg")
    : (hover ? "/CTA_arrow_left_hover.svg" : "/CTA_arrow_left.svg")

  const panelWidth = 320
  const offset = 16 // espace avec le bord écran
  const scale = 0.8 // 👈 tu peux tweak ici

  return (
    <img
      src={src}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "fixed",
        top: "50%",
        right: open ? `${panelWidth + offset}px` : `${offset}px`,
        transform: `translateY(-50%) scale(${scale})`,
        transformOrigin: "center",
        cursor: "pointer",
        zIndex: 20,
        transition: "right 0.35s ease"
      }}
    />
  )
}