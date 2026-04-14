import * as React from "react";
import { useState } from "react"; // 👈 AJOUT
import { Canvas } from "@react-three/fiber";
import Scene from "./scene.jsx";
import CustomizerPanel from "./components/CustomizerPanel"
import ArrowToggle from "./components/ArrowToggle"

export default function App() {
  const [open, setOpen] = useState(false) // 👈 AJOUT
const [starsColor, setStarsColor] = useState("#ffffff")
const [starsSeed, setStarsSeed] = useState(0)
  return (
  <>
    <Canvas
  camera={{ position: [0, 0, 5], fov: 50 }}
  style={{ background: "transparent" }}
>
      <Scene starsColor={starsColor} starsSeed={starsSeed} />
    </Canvas>

    <ArrowToggle open={open} onClick={() => setOpen(!open)} />

    <CustomizerPanel 
      open={open} 
      setStarsColor={setStarsColor}
      onRandomizeStars={(seed) => setStarsSeed(seed)}
      onClose={() => setOpen(false)}
    />
  </>
);
}