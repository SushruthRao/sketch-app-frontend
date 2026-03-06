import React, { useRef, useCallback } from 'react';
import useSketchFrameCache from '../hooks/useSketchFrameCache';

const SketchCheckbox = ({
  checked = false,
  onChange,
  label = "",
  fps = 8,
  stroke = '#000',
}) => {
  const canvasRef = useRef(null);
  const boxSize = 22;
  const padding = 5;
  const canvasSize = boxSize + padding * 2;

  const drawFrame = useCallback((rc, ctx, canvas) => {
    rc.rectangle(padding, padding, boxSize, boxSize, {
      roughness: 1.0,
      stroke: stroke,
      strokeWidth: 1.5,
      fill: checked ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
      fillStyle: 'hachure',
      hachureGap: 4,
    });

    if (checked) {
      rc.line(padding + 4, padding + boxSize / 2, padding + boxSize / 3, padding + boxSize - 4, {
        stroke,
        strokeWidth: 2.5,
        roughness: 0.5,
      });
      rc.line(padding + boxSize / 3, padding + boxSize - 4, padding + boxSize - 4, padding + 4, {
        stroke,
        strokeWidth: 2.5,
        roughness: 0.5,
      });
    }
  }, [checked, stroke]);

  useSketchFrameCache(canvasRef, drawFrame, [checked, fps, stroke], { fps });

  return (
    <div
      className="flex items-center gap-1 cursor-pointer select-none"
      onClick={() => onChange && onChange(!checked)}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="block"
        style={{ width: canvasSize, height: canvasSize }}
      />
      {label && (
        <span
          className="text-sm text-gray-700"
          style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default SketchCheckbox;
