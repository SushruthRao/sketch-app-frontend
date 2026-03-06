import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CURRENT_ROOMS_CONFIG as CONFIG } from '../config/LabelConfig';
import useSketchFrameCache from '../hooks/useSketchFrameCache';

const CurrentRooms = ({ fps = 7, rooms = [], loading = false, onJoin }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const drawFrame = useCallback((rc, ctx, canvas) => {
    rc.rectangle(4, 4, dimensions.width - 8, dimensions.height - 8, {
      roughness: 0.8,
      stroke: '#333',
      strokeWidth: 2,
      fill: 'rgba(255, 255, 255, 0.15)',
      fillStyle: 'hachure',
      hachureGap: 12,
    });

    rc.line(12, 42, dimensions.width - 12, 42, {
      roughness: 0.6,
      stroke: '#555',
      strokeWidth: 1.2,
    });
  }, [dimensions]);

  useSketchFrameCache(canvasRef, drawFrame, [dimensions, fps], { fps });

  return (
    <div
      ref={containerRef}
      className="relative w-full mx-auto flex flex-col"
      style={{ minHeight: '220px', maxWidth: '300px' }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div className="relative flex flex-col h-full p-4" style={{ zIndex: 1 }}>
        <h3
          className="text-base font-bold text-center mb-3 pb-1"
          style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
        >
          {CONFIG.title}
        </h3>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p
              className="text-center text-gray-500 text-sm mt-4"
              style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
            >
              {CONFIG.messages.loading}
            </p>
          ) : rooms.length === 0 ? (
            <p
              className="text-center text-gray-500 text-sm mt-4"
              style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
            >
              {CONFIG.messages.empty}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {rooms.slice(0, 5).map((room) => (
                <li
                  key={room.roomCode}
                  className="flex items-center justify-between px-2 py-1.5 rounded transition-colors hover:bg-black/5"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-sm truncate leading-tight"
                      style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
                    >
                      {room.hostUsername}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs text-gray-400 leading-tight tracking-widest font-mono"
                      >
                        #{room.roomCode}
                      </span>
                      <span
                        className="text-xs text-gray-500 leading-tight"
                        style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
                      >
                        · {room.playerCount}/{room.maxPlayers}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoin && onJoin(room.roomCode)}
                    className="ml-2 px-3 py-0.5 text-xs border-2 border-black transition-colors hover:bg-green-100 active:scale-95"
                    style={{
                      fontFamily: "'Gloria Hallelujah', cursive",
                      borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
                    }}
                  >
                    {CONFIG.messages.joinButton}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentRooms;
