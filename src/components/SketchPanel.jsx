import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

/**
 * A container that draws a rough.js hand-sketched rectangle border
 * which adapts to the element's size via ResizeObserver.
 *
 * Props:
 *  className      — classes on the outer wrapper (add layout classes here)
 *  innerClassName — classes on the inner content div
 *  roughness      — rough.js roughness (default 0.7)
 *  strokeWidth    — rough.js strokeWidth (default 1.7)
 *  wInset         — total horizontal inset for the rectangle width  (default 10)
 *  hInset         — total vertical   inset for the rectangle height (default 10)
 */
const SketchPanel = ({
  children,
  className = '',
  innerClassName = '',
  roughness = 0.7,
  strokeWidth = 1.7,
  wInset = 10,
  hInset = 10,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      const cvs = canvasRef.current;
      if (!cvs) return;
      cvs.width = width;
      cvs.height = height;
      const rc = rough.canvas(cvs);
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      rc.rectangle(5, 5, width - wInset, height - hInset, {
        roughness,
        stroke: '#333',
        strokeWidth,
        fill: 'transparent',
      });
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, [roughness, strokeWidth, wInset, hInset]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none -z-10" />
      <div className={innerClassName}>{children}</div>
    </div>
  );
};

export default SketchPanel;
