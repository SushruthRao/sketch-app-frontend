import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

const SketchArrowToggle = ({ isOpen, onClick, unreadCount = 0 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rc.rectangle(2, 2, canvas.width - 4, canvas.height - 4, {
      roughness: 1.4,
      stroke: '#444',
      strokeWidth: 1.6,
      fill: 'rgba(225, 229, 232, 0.97)',
      fillStyle: 'solid',
      bowing: 1.2,
    });
  }, [isOpen]);

  return (
    <button onClick={onClick} className="relative" style={{ width: 88, height: 34 }}>
      <canvas ref={canvasRef} width={88} height={34} className="absolute inset-0" />
      <span className="relative z-10 font-gloria text-xs flex items-center justify-center gap-1.5 w-full h-full select-none">
        <span
          className="inline-block transition-transform duration-300 text-sm"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ›
        </span>
        {isOpen ? 'Close' : 'Chat'}
        {!isOpen && unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </span>
    </button>
  );
};

export default SketchArrowToggle;
