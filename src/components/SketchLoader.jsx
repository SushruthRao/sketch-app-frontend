import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';
import paperBg from '../assets/paper_background.jpg';

const SketchLoader = ({ message = "Loading..." }) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const timeRef = useRef(0);
  const FPS = 30;
  const fpsInterval = 1000 / FPS;

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
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        const rotationAngle = timeRef.current * 0.1; 
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


        timeRef.current += 1;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [fpsInterval]);

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
