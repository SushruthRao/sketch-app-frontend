import React, { useRef, useCallback } from 'react';
import paperBg from '../assets/paper_background.jpg';
import useSketchFrameCache from '../hooks/useSketchFrameCache';

const FRAME_COUNT = 12;

const SketchLoader = ({ message = "Loading..." }) => {
  const canvasRef = useRef(null);
  const FPS = 12;

  const drawFrame = useCallback((rc, ctx, canvas, frameIndex) => {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    const rotationAngle = (frameIndex / FRAME_COUNT) * Math.PI * 2;
    ctx.rotate(rotationAngle);
    rc.arc(
      0, 0,
      50, 50,
      0, Math.PI * 1.5,
      false,
      {
        stroke: '#000000',
        strokeWidth: 2,
        roughness: 1.5,
      }
    );
    ctx.restore();

    ctx.font = "18px 'Gloria Hallelujah'";
    ctx.fillStyle = '#000000';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 80);
  }, [message]);

  useSketchFrameCache(canvasRef, drawFrame, [message], { frameCount: FRAME_COUNT, fps: FPS });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundImage: `url(${paperBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="block bg-transparent"
      />
    </div>
  );
};

export default SketchLoader;
