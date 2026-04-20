import React from "react";

export default function Entity({ x = 0, y = 0 }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "20px",
        height: "20px",
        background: "red",
        transform: `translate(${x}px, ${y}px)`,
        zIndex: 10
      }}
    />
  );
}