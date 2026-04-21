import React, { useEffect, useMemo, useRef, useState } from "react";
import { useWorldStore } from "../store/worldSlice";
import { usePetStore } from "../store/usePetstore";

import controlUp from "../../hud/Control_Keys/Control_Up.webp";
import controlDown from "../../hud/Control_Keys/Control_Down.webp";
import controlLeft from "../../hud/Control_Keys/Control_Left.webp";
import controlRight from "../../hud/Control_Keys/Control_Right.webp";

import controlUpPressed from "../../hud/Control_Keys/Control_Up_Pressed.webp";
import controlDownPressed from "../../hud/Control_Keys/Control_Down_Pressed.webp";
import controlLeftPressed from "../../hud/Control_Keys/Control_Left_Pressed.webp";
import controlRightPressed from "../../hud/Control_Keys/Control_Right_Pressed.webp";

const CONTROL_SIZE = 52;

function ControlButton({ image, pressedImage, pressed, onPress, onRelease, label, color }) {
  const displayImage = pressed ? pressedImage || image : image;
  return (
    <button
      aria-label={label}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={onRelease}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      onTouchEnd={onRelease}
      onTouchCancel={onRelease}
      style={{
        width: `${CONTROL_SIZE}px`,
        height: `${CONTROL_SIZE}px`,
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        position: "relative",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <img
          src={displayImage}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            imageRendering: "pixelated",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: color || "#8f8f8f",
            mixBlendMode: "color",
            pointerEvents: "none",
            WebkitMaskImage: `url(${displayImage})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
            maskImage: `url(${displayImage})`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
          }}
        />
      </div>
    </button>
  );
}

export default function PetControls() {
  const moveWorld = useWorldStore((s) => s.moveWorld);
  const keysRef = useRef({});
  const theme = usePetStore((s) => s.theme);
  const color = theme?.modelColor || "#8f8f8f";

  const [pressed, setPressed] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const keyToDirection = useMemo(
    () => ({
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    }),
    []
  );

  useEffect(() => {
    const isDesktop = window.innerWidth > 768;
    if (!isDesktop) return;

    const speed = 4;

    const handleDown = (e) => {
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        e.preventDefault();
        keysRef.current[key] = true;
        const direction = keyToDirection[key];
        if (direction) {
          setPressed((prev) => ({ ...prev, [direction]: true }));
        }
      }
    };

    const handleUp = (e) => {
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        keysRef.current[key] = false;
        const direction = keyToDirection[key];
        if (direction) {
          setPressed((prev) => ({ ...prev, [direction]: false }));
        }
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
  }, [moveWorld, keyToDirection]);

  const setDirectionPressed = (direction, value) => {
    setPressed((prev) => ({ ...prev, [direction]: value }));
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 999,
        display: "grid",
        gridTemplateColumns: "repeat(3, 52px)",
        gridTemplateRows: "repeat(2, 52px)",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      <div />
      <ControlButton
        image={controlUp}
        pressedImage={controlUpPressed}
        pressed={pressed.up}
        label="Move up"
        color={color}
        onPress={() => {
          setDirectionPressed("up", true);
          moveWorld(0, 20);
        }}
        onRelease={() => setDirectionPressed("up", false)}
      />
      <div />

      <ControlButton
        image={controlLeft}
        pressedImage={controlLeftPressed}
        pressed={pressed.left}
        label="Move left"
        color={color}
        onPress={() => {
          setDirectionPressed("left", true);
          moveWorld(20, 0);
        }}
        onRelease={() => setDirectionPressed("left", false)}
      />
      <ControlButton
        image={controlDown}
        pressedImage={controlDownPressed}
        pressed={pressed.down}
        label="Move down"
        color={color}
        onPress={() => {
          setDirectionPressed("down", true);
          moveWorld(0, -20);
        }}
        onRelease={() => setDirectionPressed("down", false)}
      />
      <ControlButton
        image={controlRight}
        pressedImage={controlRightPressed}
        pressed={pressed.right}
        label="Move right"
        color={color}
        onPress={() => {
          setDirectionPressed("right", true);
          moveWorld(-20, 0);
        }}
        onRelease={() => setDirectionPressed("right", false)}
      />
    </div>
  );
}
