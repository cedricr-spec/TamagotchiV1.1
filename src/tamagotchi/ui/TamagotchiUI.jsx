import React, { useEffect, useRef, useState } from "react"
import { usePetStore } from "../store/usePetStore"

function hexToFilter(hex) {
  const color = tinycolor(hex)
  const { r, g, b } = color.toRgb()

  return `
    brightness(0) 
    saturate(100%) 
    invert(${r / 255}) 
    sepia(${g / 255}) 
    saturate(${b * 2}%) 
  `
}
export default function TamagotchiUI() {
  const { hunger, energy, happiness, feed, play, sleep, tick } = usePetStore()
const uiRef = useRef()
  const eyesRef = useRef()
  const mouthRef = useRef()
  const bodyRef = useRef()

  const [isBlinking, setIsBlinking] = useState(false)
  const [mouth, setMouth] = useState("neutral")
  const [eyesState, setEyesState] = useState("default")
  const { petColor } = usePetStore()

const bodyColor = "var(--pet-color)"
const outlineColor = "var(--pet-outline)"
const eyesColor = "var(--pet-eyes)"
const mouthColor = "var(--pet-mouth)"

  // 🧠 boucle de vie
  useEffect(() => {
    const interval = setInterval(() => tick(), 5000)
    return () => clearInterval(interval)
  }, [])

  // 😶 logique bouche
  useEffect(() => {
    if (energy < 20) setMouth("null")
    else if (happiness > 70) setMouth("happy")
    else if (happiness < 30) setMouth("sad")
    else setMouth("neutral")
  }, [happiness, energy])

  // 👀 logique yeux
  useEffect(() => {
    if (energy < 30) setEyesState("sleepy")
    else if (happiness > 70) setEyesState("happy")
    else setEyesState("default")
  }, [happiness, energy])

  // 🫁 respiration
  useEffect(() => {
    let t = 0

    const loop = () => {
      t += 0.02
      const scale = 1 + Math.sin(t) * 0.015

      if (bodyRef.current) {
        bodyRef.current.style.transform = `scale(${scale})`
      }

      requestAnimationFrame(loop)
    }

    loop()
  }, [])

  // 👀 regard contextuel (eyes + mouth)
  const target = useRef({ x: 0, y: 0 })
  const currentEyes = useRef({ x: 0, y: 0 })
  const currentMouth = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e) => {
      const sensitivity = happiness > 70 ? 16 : happiness > 30 ? 12 : 8

      target.current.x = (e.clientX / window.innerWidth - 0.5) * sensitivity
      target.current.y = (e.clientY / window.innerHeight - 0.5) * sensitivity
    }

    window.addEventListener("mousemove", handleMove)

    let idleTimeout

    const loop = () => {
      if (eyesRef.current) {
        const speed = energy > 70 ? 0.12 : energy > 30 ? 0.08 : 0.04
        const drift = hunger > 60 ? (Math.random() - 0.5) * 0.5 : 0

        currentEyes.current.x += (target.current.x - currentEyes.current.x) * speed + drift
        currentEyes.current.y += (target.current.y - currentEyes.current.y) * speed + drift

        eyesRef.current.style.transform = `translate(${currentEyes.current.x}px, ${currentEyes.current.y}px)`
      }

      // 👇 bouche suit légèrement (sauf null)
      if (mouthRef.current && mouth !== "null") {
  // 👇 buffer pour créer un vrai delay
if (!currentMouth.current.history) {
  currentMouth.current.history = []
}

// on stocke les positions passées
currentMouth.current.history.push({
  x: target.current.x,
  y: target.current.y
})

// 👇 garde seulement les 10 dernières frames (~delay)
if (currentMouth.current.history.length > 10) {
  currentMouth.current.history.shift()
}

// 👇 on prend une ancienne position → delay réel
const delayed = currentMouth.current.history[0] || { x: 0, y: 0 }

// 👇 beaucoup moins sensible
const reducedX = delayed.x * 0.35
const reducedY = delayed.y * 0.35

// 👇 plus lent aussi
currentMouth.current.x += (reducedX - currentMouth.current.x) * 0.03
currentMouth.current.y += (reducedY - currentMouth.current.y) * 0.03

        mouthRef.current.style.transform = `translate(${currentMouth.current.x}px, ${currentMouth.current.y}px)`
      }

      requestAnimationFrame(loop)
    }

    loop()

    const resetIdle = () => {
      clearTimeout(idleTimeout)
      idleTimeout = setTimeout(() => {
        target.current.x = 0
        target.current.y = 0
      }, 2000)
    }

    window.addEventListener("mousemove", resetIdle)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mousemove", resetIdle)
    }
  }, [happiness, energy, hunger, mouth])

  // 👁️ blink (override uniquement le default/happy)
  useEffect(() => {
    let timeout

    const blinkLoop = () => {
      const delay = 2000 + Math.random() * 4000

      timeout = setTimeout(() => {
        const doDouble = Math.random() < 0.3

        if (eyesState === "sleepy") {
          blinkLoop()
          return
        }

        const blink = () => {
          setIsBlinking(true)
          setTimeout(() => setIsBlinking(false), 120)
        }

        if (doDouble) {
          blink()
          setTimeout(blink, 180)
        } else {
          blink()
        }

        blinkLoop()
      }, delay)
    }

    blinkLoop()
    return () => clearTimeout(timeout)
  }, [eyesState])

  // 🎯 choix texture yeux
  const getEyesSrc = () => {
    if (eyesState === "sleepy") return "/pets/default/eyes_sleepy.svg"
    if (isBlinking) return "/pets/default/eyes_blink.svg"
    if (eyesState === "happy") return "/pets/default/eyes_happy.svg"
    return "/pets/default/eyes.svg"
  }

 return (
  <div
  ref={uiRef}
  id="tamagotchi-ui"
  style={{
    position: "relative",
    width: "100%", // 🔥 fill parent
    height: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}
>


    {/* 🔥 CONTENU */}
    <div
      style={{
        position: "relative",
        zIndex: 2,
        padding: "16px",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        fontSize: "12px"
      }}
    >

      {/* pet */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <div ref={bodyRef} style={{ position: "relative" }}>
          {/* BODY */}
          <div
  style={{
    width: "50px",
    height: "50px",

    // 👇 OUTLINE ICI
    filter: `
      drop-shadow(0.5px 0 0 ${outlineColor})
      drop-shadow(-0.5px 0 0 ${outlineColor})
      drop-shadow(0 0.5px 0 ${outlineColor})
      drop-shadow(0 -0.5px 0 ${outlineColor})
    `
  }}
>
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: bodyColor,

      WebkitMaskImage: "url(/pets/default/body.svg)",
      WebkitMaskRepeat: "no-repeat",
      WebkitMaskSize: "contain",
      WebkitMaskPosition: "center",

      maskImage: "url(/pets/default/body.svg)",
      maskRepeat: "no-repeat",
      maskSize: "contain",
      maskPosition: "center"
    }}
  />
</div>

          {/* EYES */}
          <div
  ref={eyesRef}
  style={{
    width: "50px",
    height: "50px",
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: eyesColor,

    WebkitMaskImage: `url(${getEyesSrc()})`,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",

    maskImage: `url(${getEyesSrc()})`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center"
  }}
/>

          {/* MOUTH */}
          <div
  ref={mouthRef}
  style={{
    width: "50px",
    height: "50px",
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: mouthColor,

    WebkitMaskImage: `url(/pets/default/mouth_${mouth}.svg)`,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",

    maskImage: `url(/pets/default/mouth_${mouth}.svg)`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center"
  }}
/>
        </div>
      </div>

          </div>
    </div>
  )
}