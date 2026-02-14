import React, { useEffect, useRef, useState, useCallback } from 'react';
import rough from 'roughjs';

const SketchSlider = ({ 
  min = 1, 
  max = 20, 
  value, 
  onChange, 
  color = 'rgba(7, 7, 7, 0.52)',
  stroke = '#000'
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const updateValue = useCallback((clientX) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 15; 
    const trackWidth = rect.width - (padding * 2);
    const x = Math.max(0, Math.min(clientX - rect.left - padding, trackWidth));
    const newValue = Math.round((x / trackWidth) * (max - min) + min);
    onChange(newValue);
  }, [max, min, onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const padding = 15;
    const centerY = canvas.height / 2;
    const trackWidth = canvas.width - (padding * 2);
    const thumbX = padding + ((value - min) / (max - min)) * trackWidth;

    rc.line(padding, centerY, canvas.width - padding, centerY, {
      stroke,
      strokeWidth: 1.1,
      roughness: 1,
    });

    rc.circle(thumbX, centerY, isDragging ? 22 : 18, {
      stroke,
      fill: color,
      fillStyle: 'hachure',
      hachureGap: 4,
      roughness: 1.5,
      strokeWidth: 1.2
    });
    
  }, [dimensions, value, isDragging, color, stroke, min, max]);

  return (
    <div 
      ref={containerRef} 
      className="w-42 h-12 flex items-center select-none"
      onPointerDown={(e) => {
        setIsDragging(true);
        updateValue(e.clientX);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => isDragging && updateValue(e.clientX)}
      onPointerUp={() => setIsDragging(false)}
    >
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="block touch-none cursor-pointer"
      />
    </div>
  );
};

export default SketchSlider;
