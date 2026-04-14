import React from "react";
import { Html } from "@react-three/drei";
import TamagotchiUI from "../ui/TamagotchiUI";

export default function PetScreen() {
  return (
    <Html transform occlude={false}>
      <div style={{ width: 64, height: 64 }}>
        <TamagotchiUI />
      </div>
    </Html>
  );
}