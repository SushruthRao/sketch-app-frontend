import React, { useRef, useEffect, useState } from 'react';
import PencilScene from './PencilScene';
import BackgroundCanvasFill from './BackgroundCanvasFill';

const hexToRgbValues = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : "255, 215, 0"; 
};

const AnimatedPencilWithBackground = ({ 
  color = "#929292", 
  isSelected,
  onSelect,
  width = "100%",
  height = "100%"
}) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false); // Track hover state locally

  const rgbString = hexToRgbValues(color);
  const defaultRgbString = hexToRgbValues("#555555");
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries.length || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative flex items-center justify-center overflow-hidden bg-transparent"
      style={{ width, height, cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {size.width > 0 && (isSelected || (isSelected && isHovered)) && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <BackgroundCanvasFill 
            width={size.width} 
            height={size.height} 
            diameter={Math.min(size.width, size.height) * 0.75} 
            color={rgbString} 
            fps={10}
          />
        </div>
      )}
      {size.width > 0 && (!isSelected) && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <BackgroundCanvasFill 
            width={size.width} 
            height={size.height} 
            diameter={Math.min(size.width, size.height) * 0.75} 
            color={defaultRgbString} 
            fps={10}
          />
        </div>
      )}

      <div className="relative z-10 w-full h-full pointer-events-none">
        <PencilScene 
          isSelected={isSelected} 
          onSelect={onSelect} 
          sceneWidth="100%"
          sceneHeight="100%"
          highlightColor={color} 
        />
      </div>
    </div>
  );
};

export default AnimatedPencilWithBackground;
