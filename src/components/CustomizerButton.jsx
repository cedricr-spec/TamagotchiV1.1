import React from "react"
import { useState } from "react"

export default function CustomizerButton({ onClick }) {
  const [hover, setHover] = useState(false)

  return (
    <img
      src={hover 
        ? "/CTA_personnaliser_hover.svg" 
        : "/CTA_personnaliser.svg"}
      
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}

      style={{
        position: "fixed",
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "220px",
        cursor: "pointer",
        zIndex: 20
      }}
    />
  )
}