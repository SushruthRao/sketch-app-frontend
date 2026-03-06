import React, { useEffect, useRef, useState, useCallback } from 'react';
import useSketchFrameCache from '../hooks/useSketchFrameCache';

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
  const leftArrowRef = useRef(null);
  const rightArrowRef = useRef(null);
  const containerRef = useRef(null);
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

  const drawMainFrame = useCallback((rc, ctx, canvas) => {
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
  }, [isFocused, color, stroke]);

  useSketchFrameCache(canvasRef, drawMainFrame, [dimensions, isFocused, color, stroke, fps], { fps });

  const drawLeftArrow = useCallback((rc, ctx, canvas) => {
    if (!isFocused) return;
    const arrowW = 60;
    const midY = 20;
    rc.line(5, midY, arrowW - 10, midY, { stroke, strokeWidth: 2, roughness: 2 });
    rc.line(arrowW - 10, midY, arrowW - 25, midY - 10, { stroke, strokeWidth: 2 });
    rc.line(arrowW - 10, midY, arrowW - 25, midY + 10, { stroke, strokeWidth: 2 });
  }, [isFocused, stroke]);

  useSketchFrameCache(leftArrowRef, drawLeftArrow, [isFocused, stroke], { fps });

  const drawRightArrow = useCallback((rc, ctx, canvas) => {
    if (!isFocused) return;
    const arrowW = 60;
    const midY = 20;
    rc.line(10, midY, arrowW - 5, midY, { stroke, strokeWidth: 2, roughness: 2 });
    rc.line(10, midY, 25, midY - 10, { stroke, strokeWidth: 2 });
    rc.line(10, midY, 25, midY + 10, { stroke, strokeWidth: 2 });
  }, [isFocused, stroke]);

  useSketchFrameCache(rightArrowRef, drawRightArrow, [isFocused, stroke], { fps });

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
