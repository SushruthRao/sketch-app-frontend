import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

const BackgroundCanvasFill = ({ 
  width = 400, 
  height = 400, 
  diameter = 300, 
  fps = 10, 
  color = '255, 215, 0' 
}) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    let lastDrawTime = performance.now();
    const fpsInterval = 1000 / fps;

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, diameter / 2);
        gradient.addColorStop(0, `rgba(${color}, 0.95)`);
        gradient.addColorStop(0.4, `rgba(${color}, 0.5)`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);

        rc.circle(cx, cy, diameter, {
          stroke: 'none',
          fill: gradient,
          fillStyle: 'zigzag',
          roughness: 4,
          zigzagOffset: 6,
        });
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [diameter, fps, color, width, height]); 

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      
      style={{ width, height,background: 'transparent', display: 'block' }} 
    />
  );
};

export default BackgroundCanvasFill;
