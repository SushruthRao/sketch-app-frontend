import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { TOAST_CONFIG as CONFIG } from '../config/LabelConfig';

const SketchToast = ({ 
  closeToast, 
  isPaused, 
  toastProps, 
  isError,
  text = CONFIG.default.text,
  color = CONFIG.default.color,
  stroke = CONFIG.default.stroke,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [progress, setProgress] = useState(1);
  const remainingTimeRef = useRef(toastProps.autoClose);

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
    if (isPaused) return;
    const interval = setInterval(() => {
      remainingTimeRef.current -= 50; 
      const p = Math.max(0, remainingTimeRef.current / toastProps.autoClose);
      setProgress(p);
      if (p <= 0) {
        clearInterval(interval);
        closeToast();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPaused, closeToast, toastProps.autoClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const pad = 5;
    const paddingX = 25; 
    const rectWidth = canvas.width - pad * 2;
    const rectHeight = canvas.height - pad * 2;

    rc.rectangle(pad, pad, rectWidth, rectHeight, {
      roughness: 0.8,
      stroke: 'transparent', 
      fill: '#ffffffb6',      
      fillStyle: 'solid'
    });

    rc.rectangle(pad, pad, rectWidth, rectHeight, {
      roughness: 0.8,
      fill: isError ? CONFIG.default.errorFillColor : CONFIG.default.successFillColor,
      fillStyle: 'hachure',
      stroke: stroke,        
      strokeWidth: 1.5
    });

    let fontSize = 18; 
    const maxWidth = canvas.width - (pad * 2) - (paddingX * 2);
    ctx.font = `${fontSize}px ${CONFIG.default.font}`;
    while (ctx.measureText(text).width > maxWidth && fontSize > 8) {
      fontSize -= 0.7;
      ctx.font = `${fontSize}px ${CONFIG.default.font}`;
    }
    // ctx.fill = 'black';
    ctx.fillStyle = stroke;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, (canvas.height / 2) - 5);

    const barHeight = 6;
    if (progress > 0) {
      rc.rectangle(pad + 10, canvas.height - barHeight - 15, (canvas.width - pad * 2 - 20) * progress, barHeight, {
        roughness: 1.3,
        fill: stroke,
        fillStyle: CONFIG.default.fillStyle,
        stroke: stroke,
        hachureGap: 3
      });
    }

  }, [dimensions, progress, color, stroke, text, isError]);

  return (
    <div ref={containerRef} className="w-full h-20 relative overflow-hidden">
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default SketchToast;
