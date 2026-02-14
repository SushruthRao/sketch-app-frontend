/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

const SketchPageNotFound = ({ 
  color = 'rgba(107, 107, 107, 0.5)',
  stroke = '#000',
  strokeWidth = 2.5,
  fps = 7
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);   
  const requestRef = useRef();
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const fpsInterval = 1000 / fps;

  const paths = {
    four: "M30 10 L10 70 L60 70 M45 10 L45 90",
    zero: "M30 10 C10 10, 5 30, 5 50 C5 70, 10 90, 30 90 C50 90, 55 70, 55 50 C55 30, 50 10, 30 10 Z"
  };

  useEffect(() => {
    const observeTarget = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDims({
          width: entry.contentRect.width,
          height: Math.min(entry.contentRect.width * 0.4, 300) 
        });
      }
    });

    if (observeTarget) resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.width === 0) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    let lastDrawTime = performance.now();

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = dims.width < 400 ? 0.6 : 1; 
        const digitWidth = 70 * scale;
        const spacing = 30 * scale;
        const totalWidth = (digitWidth * 3) + (spacing * 2);
        
        const startX = (dims.width - totalWidth) / 2;
        const startY = (dims.height - (100 * scale)) / 2;

        const style = {
          stroke,
          strokeWidth,
          roughness: 1.5,
          bowing: 2,
          fill: color,
          fillStyle: 'hachure',
          hachureGap: 4
        };

        const drawDigit = (path, x) => {
          ctx.save();
          ctx.translate(x, startY);
          ctx.scale(scale, scale);
          rc.path(path, style);
          ctx.restore();
        };

        drawDigit(paths.four, startX);
        drawDigit(paths.zero, startX + digitWidth + spacing);
        drawDigit(paths.four, startX + (digitWidth + spacing) * 2);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dims, fpsInterval, color, stroke, strokeWidth]);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      <canvas 
        ref={canvasRef} 
        width={dims.width} 
        height={dims.height} 
        className="block w-full h-auto"
      />
    </div>
  );
};

export default SketchPageNotFound;
