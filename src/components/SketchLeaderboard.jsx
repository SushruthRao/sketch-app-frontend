/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import SketchButton from './SketchButton';

const SketchLeaderboard = ({
  finalScores = [],
  winner,
  fps = 8,
  onHome,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const fpsInterval = 1000 / fps;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setDims({ width: w, height: Math.min(w * 0.65, 300) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.width === 0) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    let lastDrawTime = performance.now();

    const top3 = finalScores.slice(0, 3);

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;
      if (elapsed < fpsInterval) return;

      lastDrawTime = currentTime - (elapsed % fpsInterval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const sidePad = 30;
      const topPad = 20;

      // --- Title ---
      const titleSize = Math.max(20, Math.min(w * 0.07, 34));
      ctx.font = `bold ${titleSize}px 'Gloria Hallelujah'`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Game Over!', w / 2, topPad);

      // --- Podium area ---
      const podiumTop = topPad + titleSize + 60;
      const podiumBottom = h - 15;
      const podiumAreaH = podiumBottom - podiumTop;
      const podiumAreaW = w - sidePad * 2;
      const stepW = podiumAreaW / 3;

      // Step heights relative to podium area
      const stepRatios = [0.6, 1.0, 0.4]; // 2nd, 1st, 3rd
      const stepHeights = stepRatios.map((r) => podiumAreaH * r);

      const podiumColors = [
        'rgba(192, 192, 192, 0.45)', // silver
        'rgba(255, 200, 50, 0.45)',  // gold
        'rgba(205, 133, 63, 0.4)',   // bronze
      ];
      const strokeColors = [
        'rgba(120, 120, 120, 0.9)',
        'rgba(180, 140, 20, 0.9)',
        'rgba(160, 100, 40, 0.9)',
      ];
      // order[i] = which finalScores index goes in podium position i
      // positions: 0=left(2nd), 1=center(1st), 2=right(3rd)
      const scoreOrder = [1, 0, 2];
      const rankLabels = ['2nd', '1st', '3rd'];

      // --- Draw crown above 1st place step ---
      if (top3.length >= 1) {
        const crownCenterX = sidePad + stepW + stepW / 2;
        const firstStepTop = podiumBottom - stepHeights[1];
        const crownH = Math.min(stepW * 0.32, 45);
        const crownW = Math.min(stepW * 0.55, 70);
        const crownBottom = firstStepTop - 6;
        const crownTop = crownBottom - crownH;
        const cx = crownCenterX;
        const hw = crownW / 2;

        const crownPath =
          `M ${cx - hw} ${crownBottom}` +
          ` L ${cx - hw} ${crownTop + crownH * 0.45}` +
          ` L ${cx - hw * 0.45} ${crownBottom - crownH * 0.35}` +
          ` L ${cx} ${crownTop}` +
          ` L ${cx + hw * 0.45} ${crownBottom - crownH * 0.35}` +
          ` L ${cx + hw} ${crownTop + crownH * 0.45}` +
          ` L ${cx + hw} ${crownBottom}` +
          ` Z`;

        rc.path(crownPath, {
          roughness: 1.0,
          fill: 'rgba(255, 215, 0, 0.6)',
          fillStyle: 'hachure',
          stroke: '#b8860b',
          strokeWidth: 1.5,
          hachureGap: 3,
          bowing: 0.8,
        });

        // Crown jewels (small circles on the 3 peaks)
        const jewelR = Math.max(3, crownW * 0.05);
        const jewels = [
          [cx - hw, crownTop + crownH * 0.45],
          [cx, crownTop],
          [cx + hw, crownTop + crownH * 0.45],
        ];
        jewels.forEach(([jx, jy]) => {
          rc.circle(jx, jy, jewelR * 2, {
            roughness: 0.8,
            fill: 'rgba(220, 20, 60, 0.6)',
            fillStyle: 'solid',
            stroke: '#8b0000',
            strokeWidth: 0.8,
          });
        });
      }

      // --- Draw podium steps ---
      for (let i = 0; i < 3; i++) {
        const scoreIdx = scoreOrder[i];
        if (scoreIdx >= top3.length) continue;

        const x = sidePad + i * stepW;
        const stepH = stepHeights[i];
        const y = podiumBottom - stepH;

        rc.rectangle(x, y, stepW, stepH, {
          roughness: 1.5,
          fill: podiumColors[i],
          fillStyle: 'hachure',
          stroke: strokeColors[i],
          strokeWidth: 1.6,
          hachureGap: 5,
          bowing: 1.5,
        });

        // Rank label
        const rankSize = Math.max(14, Math.min(stepW * 0.22, 28));
        ctx.font = `bold ${rankSize}px 'Gloria Hallelujah'`;
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textCenterY = y + stepH * 0.35;
        ctx.fillText(rankLabels[i], x + stepW / 2, textCenterY);

        // Username
        const name = top3[scoreIdx].username || '???';
        const maxChars = Math.max(6, Math.floor(stepW / 10));
        const truncName = name.length > maxChars ? name.slice(0, maxChars - 1) + '..' : name;
        const nameSize = Math.max(11, Math.min(stepW * 0.13, 16));
        ctx.font = `${nameSize}px 'Gloria Hallelujah'`;
        ctx.fillStyle = '#000';
        ctx.fillText(truncName, x + stepW / 2, textCenterY + rankSize * 0.9);

        // Score
        const score = top3[scoreIdx].score ?? 0;
        const scoreSize = Math.max(10, Math.min(stepW * 0.11, 14));
        ctx.font = `${scoreSize}px 'Gloria Hallelujah'`;
        ctx.fillStyle = '#555';
        ctx.fillText(`${score} pts`, x + stepW / 2, textCenterY + rankSize * 0.9 + nameSize * 1.3);
      }

      // --- Base line under podium ---
      rc.line(sidePad - 5, podiumBottom, w - sidePad + 5, podiumBottom, {
        roughness: 1.2,
        stroke: '#000',
        strokeWidth: 2,
        bowing: 0.5,
      });
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dims, finalScores, fpsInterval]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-0">
      <div ref={containerRef} className="w-full shrink-0">
        <canvas
          ref={canvasRef}
          width={dims.width}
          height={dims.height}
          className="block w-full h-auto"
        />
      </div>

      {/* Full score list */}
      <div className="mt-3 px-1 overflow-y-auto flex-1 min-h-0">
        {finalScores.map((s, i) => {
          const medalColors = [
            'border-yellow-400 bg-yellow-50/80 text-yellow-800',
            'border-gray-400 bg-gray-50/80 text-gray-600',
            'border-orange-400 bg-orange-50/80 text-orange-800',
          ];
          const isTop3 = i < 3;
          return (
            <div
              key={i}
              className={`flex justify-between items-center py-2 px-4 mb-1.5 font-gloria transition-all ${
                isTop3
                  ? `border-2 ${medalColors[i]} font-bold`
                  : 'border border-black/10 text-gray-700'
              }`}
              style={{
                borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
              }}
            >
              <span className="text-base">
                {i + 1}. {s.username}
              </span>
              <span className="text-base">{s.score} pts</span>
            </div>
          );
        })}
      </div>

      {onHome && (
        <div className="mt-5 w-52 mx-auto">
          <SketchButton
            text="Home"
            color="rgba(74, 222, 128, 0.5)"
            onClick={onHome}
          />
        </div>
      )}
    </div>
  );
};

export default SketchLeaderboard;