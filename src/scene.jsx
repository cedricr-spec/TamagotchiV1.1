import React, { useRef, useEffect, useState } from "react";
import { useGLTF, Environment, useTexture, Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import StarsField from "./components/StarsField";
import PetScreen from "./tamagotchi/components/PetScreen";
import { usePetStore } from "./tamagotchi/store/usePetstore";

function getMeshBounds(root) {
  const meshBox = new THREE.Box3();
  const childBox = new THREE.Box3();
  const hasMesh = { current: false };
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (!child.isMesh) return;
    hasMesh.current = true;
    childBox.setFromObject(child);
    meshBox.union(childBox);
  });
  return hasMesh.current ? meshBox : new THREE.Box3().setFromObject(root);
}

export default function Scene({ starsColor, starsSeed }) {
  const group = useRef();
  const { camera } = useThree();

  const { scene } = useGLTF("/tamagotchi_model.glb");

  const [colorMap, normalMap, roughnessMap] = useTexture([
    "/textures/tamagotchi_bake_color.png",
    "/textures/bake_normal_tamagotchi.png",
    "/textures/bake_roughness_tamagotchi.png",
  ]);

  const [sticker1, setSticker1] = useState(null);
  const [sticker2, setSticker2] = useState(null);

  // 🎨 COLORS (store)
  const modelColor = usePetStore((state) => state.modelColor);

  // 👉 refs
  const sticker1Ref = useRef(null);
  const sticker2Ref = useRef(null);
  const screenMeshRef = useRef(null);
  const screenAnchorRef = useRef(null);

  // upload hooks
  useEffect(() => {
    window.uploadSticker1 = (file) => {
      const url = URL.createObjectURL(file);
      const tex = new THREE.TextureLoader().load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = true;
      tex.center.set(0.5, 0.5);
      tex.rotation = 0;

      sticker1Ref.current = tex;
      setSticker1(tex);
    };

    window.uploadSticker2 = (file) => {
      const url = URL.createObjectURL(file);
      const tex = new THREE.TextureLoader().load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = true;
      tex.center.set(0.5, 0.5);
      tex.rotation = 0;

      sticker2Ref.current = tex;
      setSticker2(tex);
    };

    // 👉 rotation handlers (FIX principal)
    window.setSticker1Rotation = (value) => {
      const tex = sticker1Ref.current;
      if (tex) {
        tex.rotation = value;
        tex.needsUpdate = true;
      }
    };

    window.setSticker2Rotation = (value) => {
      const tex = sticker2Ref.current;
      if (tex) {
        tex.rotation = value;
        tex.needsUpdate = true;
      }
    };

    // 🎨 PET COLOR HANDLER
    

    return () => {
      delete window.uploadSticker1;
      delete window.uploadSticker2;
      delete window.setSticker1Rotation;
      delete window.setSticker2Rotation;
      delete window.setPetColor;
    };
  }, []);

  colorMap.colorSpace = THREE.SRGBColorSpace;
  normalMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  colorMap.flipY = false;
  normalMap.flipY = false;
  roughnessMap.flipY = false;

  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (!child.isMesh) return;
      console.log("MESH:", child.name);
      const mat = child.material;
      if (!mat) return;

      const name = child.name?.toLowerCase() || "";

      // 🔥 SCREEN DETECTION (robust)
      if (name.includes("screen") || name.includes("display") || name.includes("monitor")) {
        console.log("✅ SCREEN FOUND:", child.name);
        screenMeshRef.current = child;

        // 🚨 HIDE original mesh (so Html is visible)
        child.visible = false;

        return;
      }

      if (name.includes("sticker_1")) {
        if (!sticker1) {
          mat.map = null;
          mat.opacity = 0;
        } else {
          mat.map = sticker1;
          mat.opacity = 1;
          mat.map.needsUpdate = true;
        }

        mat.transparent = true;
        mat.alphaTest = 0.01;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -1;
        mat.roughness = 1;

        mat.needsUpdate = true;
        return;
      }

      if (name.includes("sticker_2")) {
        if (!sticker2) {
          mat.map = null;
          mat.opacity = 0;
        } else {
          mat.map = sticker2;
          mat.opacity = 1;
          mat.map.needsUpdate = true;
        }

        mat.transparent = true;
        mat.alphaTest = 0.01;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -1;
        mat.roughness = 1;

        mat.needsUpdate = true;
        return;
      }

      mat.map = colorMap;
      mat.normalMap = normalMap;
      mat.roughnessMap = roughnessMap;

      // 🎨 APPLY COLOR MULTIPLIER
      mat.color = new THREE.Color(modelColor);

      mat.roughness = 1;
      mat.normalScale = new THREE.Vector2(0.25, 0.25);

      mat.needsUpdate = true;
    });

    if (!group.current.userData.initialized) {
      const box = getMeshBounds(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      group.current.position.set(-center.x, -center.y, -center.z);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.5 / maxDim;
      group.current.userData.baseScale = scale;
      group.current.scale.setScalar(scale);

      group.current.userData.initialized = true;
    }

    camera.position.set(0, 0.1, 3);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [scene, colorMap, normalMap, roughnessMap, sticker1, sticker2, modelColor]);

  useFrame((state, delta) => {
  if (!group.current) return;

  const t = state.clock.elapsedTime;
  const base = group.current.userData.baseScale || 1;
  const breath = 1 + Math.sin(t * 2) * 0.015;
  group.current.scale.setScalar(base * breath);

  // 🎯 FIX ORBIT (smooth + correct direction)
  const targetY = state.mouse.x * 0.25;
  const targetX = -state.mouse.y * 0.15;

  // smooth damping (frame-rate independent)
  const damping = 5;
  group.current.rotation.y = THREE.MathUtils.lerp(
    group.current.rotation.y,
    targetY,
    1 - Math.exp(-damping * delta)
  );

  group.current.rotation.x = THREE.MathUtils.lerp(
    group.current.rotation.x,
    targetX,
    1 - Math.exp(-damping * delta)
  );
});

  // 🎛️ MANUAL SCREEN CONTROLS (EDIT THESE)
  const screenPosition = [0, 0.565, 0.1]; // x, y, z
  const screenRotation = [0, 0, 0];      // radians
  const screenScale = 2.1;               // size

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <Environment files="/hdri.exr" background={false} blur={0.2} />
      <StarsField color={starsColor} seed={starsSeed} />

      <group ref={group}>
        <primitive object={scene} />

        <group
          position={screenPosition}
          rotation={screenRotation}
          scale={[screenScale, screenScale, screenScale]}
        >
          <Html
            transform
            occlude={true}
            distanceFactor={0.4}
            zIndexRange={[1000, 0]}
            style={{
              width: "200px",
              height: "200px",
              pointerEvents: "auto",
              background: "red",
              overflow: "hidden",
              borderRadius: "28px",
              clipPath: "inset(0 round 28px)"
            }}
          >
            <div style={{ color: "white", fontSize: "20px" }}>TEST</div>
          </Html>
        </group>
      </group>
    </>
  );
}

useGLTF.preload("/tamagotchi_model.glb");