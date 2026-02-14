import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";

const WhiteboardColorSelect = ({
  color = "rgba(25, 99, 183, 0.52)",
  stroke = "#000",
  strokeWidth = 0.9,
  fps = 8,
  onClick,
  isSelected,
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
    const ctx = canvas.getContext("2d");
    let lastDrawTime = performance.now();
    const fpsInterval = 1000 / fps;

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const padding = 5;
        const currentFill = color;
        const currentGap = 5;

        rc.rectangle(
          padding,
          padding,
          canvas.width - padding * 2,
          canvas.height - padding * 2,
          {
            roughness: 1.1,
            fill: currentFill,
            fillStyle: "hachure",
            stroke: stroke,
            strokeWidth: isHovered || isSelected ? 2 : strokeWidth,
            hachureGap: currentGap,
          },
        );

        ctx.fillStyle = stroke;

        timeRef.current += 0.07;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dimensions, color, stroke, strokeWidth, fps, isHovered, isSelected]);

  return (
    <div
      ref={containerRef}
      className="relative w-12 h-12 cursor-pointer active:scale-95 transition-all duration-200"
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
    </div>
  );
};

export default WhiteboardColorSelect;
