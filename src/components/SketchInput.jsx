import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

const SketchInput = ({
  value,
  onChange,
  placeholder = "Type here...",
  type = "text",
  color = 'rgba(0, 0, 0, 0.2)',
  stroke = '#000',
  fps = 8,
  error = ''
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const activeStroke = error ? '#dc2626' : stroke;

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

        const dynamicRoughness = isFocused
          ? 1.5
          :  1.1;

        const padding = 5;

        rc.rectangle(
          padding, padding,
          canvas.width - padding * 2, canvas.height - padding * 2,
          {
            roughness: dynamicRoughness,
            fill: error ? 'rgba(220, 38, 38, 0.08)' : (isFocused ? 'rgba(0,0,0,0.2)' : color),
            fillStyle: 'hachure',
            stroke: activeStroke,
            strokeWidth: isFocused || error ? 2 : 1,
            hachureGap: 10,
          }
        );

        timeRef.current += 0.05;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dimensions, isFocused, color, activeStroke, fps, error]);

  return (
    <div>
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
      {error && (
        <p className="font-gloria text-red-600 text-xs mt-1 ml-2"
           style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default SketchInput;
