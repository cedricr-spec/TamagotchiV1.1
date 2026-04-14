import React, { useEffect, useRef } from "react"

export default function PrairieBackground() {
  const ref = useRef()

useEffect(() => {//🧠 PLUS TARD (3D READY) quand tu passeras dans R3F : 👉 au lieu de la souris : •	tu récupères la position caméra •	tu drives le background avec ça → là ça devient ultra réaliste
  let target = { x: 0, y: 0 }
  let current = { x: 0, y: 0 }

  const handleMove = (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 12
    target.y = (e.clientY / window.innerHeight - 0.5) * 12
  }

  window.addEventListener("mousemove", handleMove)

  const loop = () => {
    current.x += (target.x - current.x) * 0.08
    current.y += (target.y - current.y) * 0.08

    if (ref.current) {
      ref.current.style.backgroundPosition = `${current.x}px ${current.y}px`
    }

    requestAnimationFrame(loop)
  }

  loop()

  return () => {
    window.removeEventListener("mousemove", handleMove)
  }
}, [])

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,

        // 🌱 base
        backgroundColor: "#7aa14b",

        // 🌱 overlay seamless
        backgroundImage: "url('/bg/bg_prairie_overlay.webp')",
        backgroundRepeat: "repeat",

        // 👉 important pour pixel art
        imageRendering: "pixelated",

        // 👉 scale du pattern
        backgroundSize: "128px"
      }}
    />
  )
}