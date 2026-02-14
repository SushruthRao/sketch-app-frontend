 
import React, { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'
import * as THREE from 'three'

const Part = ({ geometry, position = [0, 0, 0], rotation = [0, 0, 0], defaultColor = "#ffffff", hoverColor, isHighlighted }) => {
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
    <mesh ref={meshRef} geometry={geometry} position={position} rotation={rotation} frustumCulled={false}>
      <meshBasicMaterial color={defaultColor} />
      <Edges color="black" />
    </mesh>
  )
}

const EraserModel = ({ isSelected, onSelect }) => {
  const eraserRef = useRef()
  const [hovered, setHover] = useState(false)

  const geometries = useMemo(() => ({
    body: new THREE.BoxGeometry(0.9, 1.5, 0.4),
    sleeve: new THREE.BoxGeometry(0.95, 0.9, 0.45),
    hitbox: new THREE.BoxGeometry(1.2, 1.8, 0.8),
  }), [])

  useFrame((state) => {
    if (eraserRef.current) {
      const time = state.clock.elapsedTime;
      
      eraserRef.current.rotation.x += 0.005;
      eraserRef.current.rotation.y += 0.01;

         let targetScale = 0.7;
      if(isSelected) targetScale = 1.05;
      if(hovered) targetScale = 1.3;
      const s = THREE.MathUtils.lerp(eraserRef.current.scale.x, targetScale, 0.1);
      eraserRef.current.scale.set(s, s, s);

      const bobHeight = hovered ? 0.1 : 0.25;
      const bobSpeed = hovered ? 1.2 : 2.5;
      const targetY = Math.sin(time * bobSpeed) * bobHeight;
      eraserRef.current.position.y = THREE.MathUtils.lerp(eraserRef.current.position.y, targetY, 0.1);
    }
  });

  return (
    <group 
      ref={eraserRef}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (onSelect) onSelect(); 
      }}
    >
      <mesh geometry={geometries.hitbox} visible={false} />
      
      <Part 
        geometry={geometries.body} 
        isHighlighted={hovered || isSelected} 
        defaultColor="#ffffff" 
        hoverColor="#ffffff" 
      /> 
      
      <Part 
        geometry={geometries.sleeve} 
        position={[0, -0.15, 0]} 
        isHighlighted={hovered || isSelected} 
        defaultColor="#ffffff" 
        hoverColor="#4895EF" 
      />
    </group>
  )
}

export default function EraserScene({ sceneWidth = "100%", sceneHeight = "100%", isSelected, onSelect }) {
  return (
    <div style={{ width: sceneWidth, height: sceneHeight }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} alpha>
        <EraserModel isSelected={isSelected} onSelect={onSelect} />
        <OrbitControls enableZoom={false} makeDefault />
      </Canvas>
    </div>
  )
}
