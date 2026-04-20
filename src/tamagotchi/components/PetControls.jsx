import React, { useEffect, useRef } from "react";
import { useWorldStore } from "../store/worldSlice";

export default function PetControls() {
  const moveWorld = useWorldStore((s) => s.moveWorld);
  const keysRef = useRef({});

  useEffect(() => {
    const isDesktop = window.innerWidth > 768;
    if (!isDesktop) return;

    const speed = 4;

    const handleDown = (e) => {
      const key = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(key)) {
        e.preventDefault();
        keysRef.current[key] = true;
      }
    };

    const handleUp = (e) => {
      const key = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(key)) {
        keysRef.current[key] = false;
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);

    let raf;

    const loop = () => {
      const keys = keysRef.current;

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
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 999,
        display: "flex",
        gap: "8px",
      }}
    >
      <button onMouseDown={() => moveWorld(0, 20)}>↑</button>
      <button onMouseDown={() => moveWorld(0, -20)}>↓</button>
      <button onMouseDown={() => moveWorld(20, 0)}>←</button>
      <button onMouseDown={() => moveWorld(-20, 0)}>→</button>
    </div>
  );
}
