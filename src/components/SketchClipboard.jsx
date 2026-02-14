import React, { useEffect, useRef, useState } from "react";
import rough from 'roughjs';

const SketchClipboard = ({
  roomCode, 
  width = 40,
  height = 40,
  fps = 8,
}) => {
  const [copied, setCopied] = useState(false);
  const CLIPBOARD_SVG = "M89.62,13.96v7.73h12.19h0.01v0.02c3.85,0.01,7.34,1.57,9.86,4.1c2.5,2.51,4.06,5.98,4.07,9.82h0.02v0.02 v73.27v0.01h-0.02c-0.01,3.84-1.57,7.33-4.1,9.86c-2.51,2.5-5.98,4.06-9.82,4.07v0.02h-0.02h-61.7H40.1v-0.02 c-3.84-0.01-7.34-1.57-9.86-4.1c-2.5-2.51-4.06-5.98-4.07-9.82h-0.02v-0.02V92.51H13.96h-0.01v-0.02c-3.84-0.01-7.34-1.57-9.86-4.1 c-2.5-2.51-4.06-5.98-4.07-9.82H0v-0.02V13.96v-0.01h0.02c0.01-3.85,1.58-7.34,4.1-9.86c2.51-2.5,5.98-4.06,9.82-4.07V0h0.02h61.7 h0.01v0.02c3.85,0.01,7.34,1.57,9.86,4.1c2.5,2.51,4.06,5.98,4.07,9.82h0.02V13.96L89.62,13.96z M79.04,21.69v-7.73v-0.02h0.02 c0-0.91-0.39-1.75-1.01-2.37c-0.61-0.61-1.46-1-2.37-1v0.02h-0.01h-61.7h-0.02v-0.02c-0.91,0-1.75,0.39-2.37,1.01 c-0.61,0.61-1,1.46-1,2.37h0.02v0.01v64.59v0.02h-0.02c0,0.91,0.39,1.75,1.01,2.37c0.61,0.61,1.46,1,2.37,1v-0.02h0.01h12.19V35.65 v-0.01h0.02c0.01-3.85,1.58-7.34,4.1-9.86c2.51-2.5,5.98-4.06,9.82-4.07v-0.02h0.02H79.04L79.04,21.69z M105.18,108.92V35.65v-0.02 h0.02c0-0.91-0.39-1.75-1.01-2.37c-0.61-0.61-1.46-1-2.37-1v0.02h-0.01h-61.7h-0.02v-0.02c-0.91,0-1.75,0.39-2.37,1.01 c-0.61,0.61-1,1.46-1,2.37h0.02v0.01v73.27v0.02h-0.02c0,0.91,0.39,1.75,1.01,2.37c0.61,0.61,1.46,1,2.37,1v-0.02h0.01h61.7h0.02 v0.02c0.91,0,1.75-0.39,2.37-1.01c0.61-0.61,1-1.46,1-2.37h-0.02V108.92L105.18,108.92z";

  const canvasRef = useRef(null);
  const requestRef = useRef();
  const fpsInterval = 1000 / fps;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); 
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

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
        const padding = 0.8; 
        const scale = (Math.min(canvas.width, canvas.height) / originalSize) * padding;
        const xOffset = (canvas.width - (originalSize * scale)) / 2;
        const yOffset = (canvas.height - (originalSize * scale)) / 2;

        ctx.save();
        ctx.translate(xOffset, yOffset);
        ctx.scale(scale, scale);
        rc.path(CLIPBOARD_SVG, {
          stroke: '#000',
          strokeWidth: 2,
          roughness: 1,
          fill: 'black',
          fillStyle: 'hachure',
          hachureGap: 4
        });
        ctx.restore();
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [fpsInterval, width, height]);

  return (
    <div className="relative inline-flex flex-col items-center">
      <span 
        className={`absolute -top-8 text-sm font-bold transition-all duration-300 ${
          copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        Copied!
      </span>
      
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        onClick={handleCopy}
        className="cursor-pointer hover:scale-130 transition-transform active:scale-95" 
      />
    </div>
  );
};

export default SketchClipboard;
