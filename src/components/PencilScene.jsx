 
import React, { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'
import * as THREE from 'three'

const Part = ({ geometry, position = [0, 0, 0], defaultColor = "#ffffff", hoverColor, isHighlighted }) => {
  const meshRef = useRef()
  const cDefault = useMemo(() => new THREE.Color(defaultColor), [defaultColor])
  const cHover = useMemo(() => new THREE.Color(hoverColor), [hoverColor])

  useFrame(() => {
    if (meshRef.current) {
      const targetColor = isHighlighted ? cHover : cDefault
      meshRef.current.material.color.lerp(targetColor, 0.1)
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} frustumCulled={false}>
      <meshBasicMaterial color={defaultColor} />
      <Edges color="black" />
    </mesh>
  )
}

const Pencil = ({ isSelected, onSelect }) => {
  const pencilRef = useRef()
  const [hovered, setHover] = useState(false)

  const geometries = useMemo(() => ({
    body: new THREE.CylinderGeometry(0.2, 0.2, 3, 6),
    tip: new THREE.ConeGeometry(0.2, 0.6, 6),
    lead: new THREE.ConeGeometry(0.07, 0.2, 6),
    ferrule: new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12),
    eraser: new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12),
    hitbox: new THREE.CylinderGeometry(0.6, 0.6, 5, 10),
  }), [])

  useFrame((state) => {
    if (pencilRef.current) {
      const time = state.clock.elapsedTime;
      pencilRef.current.rotation.x += 0.02;
      pencilRef.current.rotation.z += 0.008;

      let targetScale = 0.8;
      if(isSelected) targetScale = 1;
      if(hovered) targetScale = 1.4;

      const s = THREE.MathUtils.lerp(pencilRef.current.scale.x, targetScale, 0.1);
      pencilRef.current.scale.set(s, s, s);

      const bobHeight = hovered ? 0.15 : 0.4;
      const bobSpeed = hovered ? 1.5 : 3;
      const targetY = Math.sin(time * bobSpeed) * bobHeight;
      pencilRef.current.position.y = THREE.MathUtils.lerp(pencilRef.current.position.y, targetY, 0.1);
    }
  });

  return (
    <group 
      ref={pencilRef}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (onSelect) onSelect(); 
      }}
    >
      <mesh geometry={geometries.hitbox} visible={false} />
      <Part geometry={geometries.body} isHighlighted={hovered || isSelected} hoverColor="#FFD700" /> 
      <Part geometry={geometries.tip} position={[0, 1.8, 0]} isHighlighted={hovered || isSelected} hoverColor="#EBC999" />
      <Part geometry={geometries.lead} position={[0, 2.1, 0]} isHighlighted={hovered || isSelected} hoverColor="#333333" />
      <Part geometry={geometries.ferrule} position={[0, -1.7, 0]} isHighlighted={hovered || isSelected} hoverColor="#AAAAAA" />
      <Part geometry={geometries.eraser} position={[0, -2.05, 0]} isHighlighted={hovered || isSelected} hoverColor="#FF8888" />
    </group>
  )
}

export default function PencilScene({ sceneWidth = "100%", sceneHeight = "100%", isSelected, onSelect }) {
  return (
    <div style={{ width: sceneWidth, height: sceneHeight }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 55 }} alpha>
        <Pencil isSelected={isSelected} onSelect={onSelect} />
        <OrbitControls enableZoom={false} makeDefault />
      </Canvas>
    </div>
  )
}
