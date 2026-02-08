//
import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

const SketchBrushIcon = ({ 
  width = 700, 
  height = 600, 
  text = "Sketch !",
  color = 'rgba(25, 99, 183, 0.52)',
  stroke = '#000',
  strokeWidth = 1,
  fps = 10 
}) => {
  const canvasRef = useRef(null);   
  const requestRef = useRef();
  const timeRef = useRef(0);
  const fpsInterval = 1000 / fps;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    let lastDrawTime = performance.now();

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const originalSize = 112;
        const targetIconHeight = canvas.height * 0.5;
        const scale = targetIconHeight / originalSize;
        ctx.save();
        const yOffset = (canvas.height - (originalSize * scale)) / 2;
        ctx.translate(10, yOffset);
        ctx.scale(scale, scale);

        rc.path('M9.44444 4.44444L12.3917 0.760432C12.7762 0.279794 13.3583 0 13.9738 0C15.0929 0 16 0.907148 16 2.02617C16 2.64169 15.7202 3.22383 15.2396 3.60835L11.5556 6.55556L12.2454 7.24538C12.7286 7.72855 13 8.38388 13 9.0672C13 9.66992 12.7887 10.2536 12.4028 10.7166L11.8246 11.4104L4.58957 4.17536L5.2834 3.59717C5.74643 3.21131 6.33008 3 6.9328 3C7.61612 3 8.27145 3.27145 8.75462 3.75462L9.44444 4.44444Z', {
          fill: 'black',
          roughness: Math.abs(Math.sin(timeRef.current)) * 1.5,
          strokeWidth: strokeWidth / scale, 
        });
        ctx.restore();
        const iconWidthWithPadding = (originalSize * scale) + 20; 
        const fontSize = Math.min(canvas.width * 0.17, canvas.height * 0.5);
        
        ctx.font = `${fontSize}px 'Gloria Hallelujah'`;
        ctx.fillStyle = stroke;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.fillText(text, iconWidthWithPadding, canvas.height / 1.7);

        timeRef.current += 0.07;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [fpsInterval, color, stroke, strokeWidth, text, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="max-w-full h-auto block" 
    />
  );
};

export default SketchBrushIcon;