import { useEffect, useRef } from 'react';
import rough from 'roughjs';

/**
 * Pre-renders `frameCount` rough.js frames to offscreen canvases, then cycles
 * through them in a requestAnimationFrame loop at the given fps.
 *
 * @param {React.RefObject} canvasRef - ref to the visible canvas element
 * @param {(rc, ctx, canvas, frameIndex) => void} drawFn - draws one frame
 * @param {any[]} deps - dependency array (regenerates cached frames on change)
 * @param {{ frameCount?: number, fps?: number }} opts
 */
export default function useSketchFrameCache(canvasRef, drawFn, deps, { frameCount = 6, fps = 8 } = {}) {
  const requestRef = useRef();
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    // Pre-render frames
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const rc = rough.canvas(offscreen);
      const ctx = offscreen.getContext('2d');
      drawFn(rc, ctx, offscreen, i);
      frames.push(offscreen);
    }
    framesRef.current = frames;
    frameIndexRef.current = 0;

    // Cycle through cached frames
    const ctx = canvas.getContext('2d');
    let lastDrawTime = performance.now();
    const fpsInterval = 1000 / fps;

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;
      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const frame = framesRef.current[frameIndexRef.current];
        if (frame) ctx.drawImage(frame, 0, 0);
        frameIndexRef.current = (frameIndexRef.current + 1) % frameCount;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
