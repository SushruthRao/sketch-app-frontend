/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const SketchButton = ({ 
  text = "Loading..",
  color = 'rgba(25, 99, 183, 0.52)',
  stroke = '#000',
  strokeWidth = 1.1,
  fps = 8,
  onClick,
  isLoading = false, 
  disableEffects = false, 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 200 };
  const stickyX = useSpring(mouseX, springConfig);
  const stickyY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    if (!containerRef.current || disableEffects) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.25; 
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

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
        const currentFill = isHovered ? color.replace(/[\d.]+\)$/g, '0.6)') : color;
        const currentGap = isHovered ? 4 : 5;

        rc.rectangle(
          padding, padding, 
          canvas.width - padding * 2, canvas.height - padding * 2, 
          {
            roughness: 1.0,
            fill: currentFill,
            fillStyle: 'hachure',
            stroke: stroke,
            strokeWidth: isHovered ? 1.5 : strokeWidth, 
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
            strokeWidth: 1.2,
            roughness: 0.8
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
    <div 
      className="relative w-full h-16"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
    >
      <motion.div 
  ref={containerRef} 
  className="w-full h-full cursor-pointer"
  onClick={onClick}
  style={{ 
    x: disableEffects ? 0 : stickyX, 
    y: disableEffects ? 0 : stickyY 
  }}
  animate={(!disableEffects && isHovered) ? { translateY: [0, -2, 0] } : { translateY: 0 }}
  
  transition={{
    translateY: { 
      duration: 2, 
      repeat: disableEffects ? 0 : Infinity, 
      ease: "easeInOut" 
    }
  }}
  
  whileTap={disableEffects ? {} : { scale: 0.98 }}
>
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height} 
          className="block w-full h-full"
        />
      </motion.div>
    </div>
  );
};

export default SketchButton;
