import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

const SketchButton = ({ 
  text = "Loading..",
  color = 'rgba(25, 99, 183, 0.52)',
  stroke = '#000',
  strokeWidth = 1.1,
  fps = 8,
  onClick,
  isLoading = false 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    let lastDrawTime = performance.now();
    const fpsInterval = 1000 / fps;

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const padding = 5; 
        const currentFill = isHovered ? color.replace(/[\d.]+\)$/g, '0.7)') : color;
        const currentGap = isHovered ? 3 : 5;

        rc.rectangle(
          padding, padding, 
          canvas.width - padding * 2, canvas.height - padding * 2, 
          {
            roughness: 1.2,
            fill: currentFill,
            fillStyle: 'hachure',
            stroke: stroke,
            strokeWidth: isHovered ? 2 : strokeWidth, 
            hachureGap: currentGap,
          }
        );

        if (isLoading) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(canvas.width, canvas.height) * 0.2;
          const startAngle = timeRef.current * 5; 
          const endAngle = startAngle + (Math.PI * 1.5); 

          rc.arc(centerX, centerY, radius * 2, radius * 2, startAngle, endAngle, false, {
            stroke: stroke,
            strokeWidth: 1.4,
            roughness: 1.1
          });
        } else {
          const fontSize = Math.min(canvas.width * 0.12, canvas.height * 0.4);
          ctx.font = `${fontSize}px 'Gloria Hallelujah'`;
          ctx.fillStyle = stroke; 
          ctx.textAlign = "center";   
          ctx.textBaseline = "middle"; 
          ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        }


        timeRef.current += 0.07;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dimensions, color, stroke, strokeWidth, text, fps, isHovered, isLoading]);

  return (
    <button 
      ref={containerRef} 
      className="relative w-full h-16 cursor-pointer active:scale-95 transition-all duration-200"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="block w-full h-full"
      />
    </button>
  );
};

export default SketchButton;
