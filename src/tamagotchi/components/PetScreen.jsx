import React from "react";
import TamagotchiUI from "../ui/TamagotchiUI";
import WorldLayer from "../components/WorldLayer";
import EntityLayer from "../components/EntityLayer";
import SpawnSystem from "../systems/SpawnSystem";
import VisibilitySystem from "../systems/VisibilitySystem";
import CleanupSystem from "../systems/CleanupSystem";
import InteractionSystem from "../systems/InteractionSystem";

export default function PetScreen() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative", // 👈 needed for layering
        overflow: "hidden"
      }}
    >
      {/* 🌍 WORLD BACKGROUND */}
      <WorldLayer />

      {/* 🌟 ENTITIES */}
      <EntityLayer />

      {/* ⚙️ SYSTEMS */}
      <SpawnSystem />
      <VisibilitySystem />
      <CleanupSystem />
      <InteractionSystem />

      {/* 🐣 UI LAYER */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none" // UI handles its own events
        }}
      >
        <TamagotchiUI />
      </div>
    </div>
  );
}