import { Canvas } from "@react-three/fiber/native";
import { useGLTF } from "@react-three/drei/native";
import { View } from "react-native";
import { useEffect } from "react";
import * as THREE from "three";

/**
 * IMPORTANT:
 * - Use require() for GLB in Expo
 * - Path must be relative to THIS FILE
 */
const avatarAsset = require("../../assets/models/avatar_base.glb");

type AvatarProps = {
  shoulders?: number; // expected 0 → 1
  chest?: number;
  waist?: number;
  hips?: number;
};

function AvatarModel({
  shoulders = 0,
  chest = 0,
  waist = 0,
  hips = 0,
}: AvatarProps) {
  const gltf = useGLTF(avatarAsset);

  // Apply morph targets whenever values change
  useEffect(() => {
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;

        const dict = mesh.morphTargetDictionary;
        const influences = mesh.morphTargetInfluences;

        if (dict["Shoulder_Width"] !== undefined)
          influences[dict["Shoulder_Width"]] = shoulders;

        if (dict["Chest_Size"] !== undefined)
          influences[dict["Chest_Size"]] = chest;

        if (dict["Waist_Width"] !== undefined)
          influences[dict["Waist_Width"]] = waist;

        if (dict["Hip_Width"] !== undefined)
          influences[dict["Hip_Width"]] = hips;
      }
    });
  }, [gltf, shoulders, chest, waist, hips]);

  /**
   * The model origin is at the feet (Blender default),
   * so we push it DOWN to center it in camera view.
   */
  return (
    <group position={[0, -1.05, 0]} scale={1}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// 🔥 Preload model once (prevents flicker / black screen)
useGLTF.preload(avatarAsset);

export function Avatar(props: AvatarProps) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Canvas
        camera={{
          position: [0, 1.6, 4], // eye level + step back
          fov: 35,
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 6, 3]} intensity={1} />
        <directionalLight position={[-3, 4, -2]} intensity={0.5} />

        {/* Avatar */}
        <AvatarModel {...props} />
      </Canvas>
    </View>
  );
}