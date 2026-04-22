import * as React from "react";
import { useState, useEffect } from "react"; // 👈 AJOUT
import { Canvas } from "@react-three/fiber";
import Scene from "./scene.jsx";
import CustomizerPanel from "./components/CustomizerPanel";
import { usePetStore } from "./tamagotchi/store/usePetstore";
import { useWorldStore } from "./tamagotchi/store/worldSlice";
import JaugesPanel from "./tamagotchi/components/JaugesPanel";
import GaugeV2 from "./tamagotchi/components/GaugeV2";
import LineMenu from "./tamagotchi/components/Line_Menu";
import PetControls from "./tamagotchi/components/PetControls";

export default function App() {
  const [open, setOpen] = useState(false) // 👈 AJOUT
  const [starsColor, setStarsColor] = useState("#ffffff")
  const [starsSeed, setStarsSeed] = useState(0)
  const [mode, setMode] = useState("device"); // "device" | "fullscreen"

  function lightenColor(hex, amount = 0.3) {
    if (!hex) return "#ffffff";
    const c = hex.replace("#", "");
    const num = parseInt(c, 16);
    let r = (num >> 16) + Math.round(255 * amount);
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * amount);
    let b = (num & 0x0000ff) + Math.round(255 * amount);

    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);

    return `rgb(${r}, ${g}, ${b})`;
  }

  const uiColor = lightenColor(starsColor, 0.25);

  const debugUI = usePetStore((s) => s.debugUI);
  const getColor = usePetStore((s) => s.getDebugColor);
  const modelColor = usePetStore((s) => s.theme.modelColor);

  useEffect(() => {
    usePetStore.getState().startGame();

    // 🔥 fix layout shift / vertical offset
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";

    return () => {
      usePetStore.getState().stopGame();
    };
  }, []);

  // 🎮 GLOBAL KEYBOARD CONTROLS (desktop)
  useEffect(() => {
    const isDesktop = window.innerWidth > 768;
    if (!isDesktop) return;

    const moveWorld = useWorldStore.getState().moveWorld;
    const keys = {};

    const handleDown = (e) => {
      const key = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(key)) {
        e.preventDefault();
        keys[key] = true;
      }
    };

    const handleUp = (e) => {
      const key = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(key)) {
        keys[key] = false;
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);

    let raf;
    const speed = 4;

    const loop = () => {
      let dx = 0;
      let dy = 0;

      if (keys["arrowup"] || keys["w"]) dy += speed;
      if (keys["arrowdown"] || keys["s"]) dy -= speed;
      if (keys["arrowleft"] || keys["a"]) dx += speed;
      if (keys["arrowright"] || keys["d"]) dx -= speed;

      if (dx !== 0 || dy !== 0) {
        moveWorld(dx, dy);
      }

      raf = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
  <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
    {debugUI && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: getColor("layout"),
          pointerEvents: "none",
          zIndex: 0
        }}
      />
    )}
    {/* 3D LAYER */}
    {!debugUI && (
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{
          background: "transparent",
          zIndex: 0,
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh"
        }}
      >
        <Scene starsColor={starsColor} starsSeed={starsSeed} mode={mode} />
      </Canvas>
    )}
    

    {/* UI LAYER */}
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: mode === "fullscreen" ? "auto" : "none", // 🔥 block mouse in fullscreen
        zIndex: 10
      }}
    >
      {debugUI && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: getColor("content"),
            pointerEvents: "none",
            zIndex: 0
          }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "40px",
          zIndex: 10000,
          pointerEvents: "auto"
        }}
      >
        {(() => {
          const [pressed, setPressed] = React.useState(false);
          return (
            <div
              onClick={() => setMode(mode === "device" ? "fullscreen" : "device")}
              onPointerDown={() => setPressed(true)}
              onPointerUp={() => setPressed(false)}
              onPointerLeave={() => setPressed(false)}
              onPointerCancel={() => setPressed(false)}
              style={{
                width: "180px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transform: pressed ? "scale(0.97)" : "scale(1)",
                transition: "transform 0.1s ease",
                position: "relative",
                touchAction: "manipulation"
              }}
            >
              <img
                src={
                  pressed
                    ? "/CTA_item_panel_click.svg"
                    : "/CTA_item_panel_unselected.svg"
                }
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  top: 0,
                  left: 0,
                  pointerEvents: "none"
                }}
              />

              <div
                style={{
                  position: "relative",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 500,
                  pointerEvents: "none"
                }}
              >
                SWITCH UI
              </div>
            </div>
          );
        })()}
      </div>

      {mode !== "fullscreen" && (
        <div
          style={{
            position: "fixed",
            top: "10vh",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90vw",          // 👈 allow more horizontal space
            maxWidth: "1200px",     // 👈 optional cap
            display: "flex",
            justifyContent: "center",
            pointerEvents: "auto",
            zIndex: 80
          }}
        >
          {debugUI && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: getColor("overlay"),
              pointerEvents: "none",
              zIndex: 0
            }} />
          )}
          <JaugesPanel />
        </div>
      )}


      <div
        style={{
          position: "fixed",
          bottom: "40px",
          transform: "translateX(-50%)",
          zIndex: 100
        }}
      >
      </div>

      {/* DEBUG CONTROLS (TEMP) */}
      <div
        style={{
          position: "fixed",
          bottom: "120px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          pointerEvents: "auto"
        }}
      >
        <PetControls />
      </div>

      {/* LINE MENU */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90vw",          // 👈 match top container
          maxWidth: "1200px",
          display: "flex",
          justifyContent: "center",
          zIndex: 50,
          pointerEvents: "auto"
        }}
      >
        {debugUI && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: getColor("text"),
            pointerEvents: "none",
            zIndex: 0
          }} />
        )}
        <LineMenu />
      </div>
      <div style={{ position: "relative", pointerEvents: "auto" }}>
        {debugUI && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: getColor("content"),
            pointerEvents: "none",
            zIndex: 0
          }} />
        )}
        <CustomizerPanel 
  open={open}
  onRandomizeStars={(seed) => setStarsSeed(seed)}
  onToggle={() => setOpen((prev) => !prev)}
/>
      </div>
    </div>
  </div>
);
}
