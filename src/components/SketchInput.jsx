import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

const SketchInput = ({ 
  value, 
  onChange, 
  placeholder = "Type here...", 
  type = "text",
  color = 'rgba(0, 0, 0, 0.2)',
  stroke = '#000',
  fps = 8 
}) => {
  const canvasRef = useRef(null);
  const leftArrowRef = useRef(null);  // Left arrow
  const rightArrowRef = useRef(null); // Right arrow
  const containerRef = useRef(null);
  const requestRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFocused, setIsFocused] = useState(false);

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
    const leftCanvas = leftArrowRef.current;
    const rightCanvas = rightArrowRef.current;
    if (!canvas || dimensions.width === 0) return;

    const rc = rough.canvas(canvas);
    const lrc = leftCanvas ? rough.canvas(leftCanvas) : null;
    const rrc = rightCanvas ? rough.canvas(rightCanvas) : null;
    
    const ctx = canvas.getContext('2d');
    const lctx = leftCanvas?.getContext('2d');
    const rctx = rightCanvas?.getContext('2d');
    
    let lastDrawTime = performance.now();
    const fpsInterval = 1000 / fps;

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (lctx) lctx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        if (rctx) rctx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);

        // Draw main input box
        const padding = 5; 
        rc.rectangle(
          padding, padding, 
          canvas.width - padding * 2, canvas.height - padding * 2, 
          {
            roughness: isFocused ? 1.5 : 1.1,
            fill: isFocused ? 'rgba(0,0,0,0.2)' : color,
            fillStyle: 'hachure',
            stroke: stroke,
            strokeWidth: isFocused ? 2 : 1,
            hachureGap: 10,
          }
        );

        if (isFocused) {
          const arrowW = 60;
          const midY = 20;

          // Left Arrow (Pointing Right ->)
          if (lrc) {
            lrc.line(5, midY, arrowW - 10, midY, { stroke, strokeWidth: 2, roughness: 2 });
            lrc.line(arrowW - 10, midY, arrowW - 25, midY - 10, { stroke, strokeWidth: 2 });
            lrc.line(arrowW - 10, midY, arrowW - 25, midY + 10, { stroke, strokeWidth: 2 });
          }

          // Right Arrow (Pointing Left <-)
          if (rrc) {
            rrc.line(10, midY, arrowW - 5, midY, { stroke, strokeWidth: 2, roughness: 2 });
            rrc.line(10, midY, 25, midY - 10, { stroke, strokeWidth: 2 });
            rrc.line(10, midY, 25, midY + 10, { stroke, strokeWidth: 2 });
          }
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dimensions, isFocused, color, stroke, fps]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Left Arrow */}
      <canvas 
        ref={leftArrowRef}
        width={60}
        height={40}
        className={`absolute -left-16 transition-opacity duration-300 pointer-events-none ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div 
        ref={containerRef} 
        className="relative w-full h-14 transition-all duration-200"
      >
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height} 
          className="absolute inset-0 pointer-events-none"
        />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="relative z-10 w-full h-full bg-transparent border-none outline-none px-6 
                     font-gloria text-lg text-gray-800 placeholder-gray-500"
          style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
        />
      </div>

      {/* Right Arrow */}
      <canvas 
        ref={rightArrowRef}
        width={60}
        height={40}
        className={`absolute -right-16 transition-opacity duration-300 pointer-events-none ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default SketchInput;
