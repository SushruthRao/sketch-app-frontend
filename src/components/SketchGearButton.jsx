import React, { useRef, useEffect, useState, useCallback } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';

const SketchGearButton = ({ onClick, size = 44 }) => {
    const canvasRef = useRef(null);
    const [hovered, setHovered] = useState(false);

    const draw = useCallback(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        cvs.width = size;
        cvs.height = size;
        const rc = rough.canvas(cvs);
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2;
        const cy = size / 2;
        const outerR = size * 0.36;
        const innerR = size * 0.20;
        const holeR  = size * 0.10;
        const toothCount = 8;
        const toothDepth = size * 0.10;
        const toothArc = (Math.PI * 2) / toothCount;
        const halfTooth = toothArc * 0.28;

        const fill = hovered ? 'rgba(60,60,60,0.85)' : 'rgba(50,50,50,0.7)';
        const stroke = hovered ? '#000' : '#222';
        const opts = { roughness: 0.9, stroke, strokeWidth: 1.0, fill, fillStyle: 'solid' };

        // Build gear body path (outer ring with teeth as bumps via polygon)
        const pts = [];
        for (let i = 0; i < toothCount; i++) {
            const baseAngle = (i / toothCount) * Math.PI * 2 - Math.PI / 2;
            // valley before tooth
            pts.push([
                cx + Math.cos(baseAngle - toothArc * 0.5 + halfTooth) * outerR,
                cy + Math.sin(baseAngle - toothArc * 0.5 + halfTooth) * outerR,
            ]);
            // rising edge of tooth
            pts.push([
                cx + Math.cos(baseAngle - halfTooth) * (outerR + toothDepth),
                cy + Math.sin(baseAngle - halfTooth) * (outerR + toothDepth),
            ]);
            // top of tooth
            pts.push([
                cx + Math.cos(baseAngle + halfTooth) * (outerR + toothDepth),
                cy + Math.sin(baseAngle + halfTooth) * (outerR + toothDepth),
            ]);
            // falling edge of tooth
            pts.push([
                cx + Math.cos(baseAngle + toothArc * 0.5 - halfTooth) * outerR,
                cy + Math.sin(baseAngle + toothArc * 0.5 - halfTooth) * outerR,
            ]);
        }
        rc.polygon(pts, opts);

        // Inner hole (white circle to punch through)
        rc.circle(cx, cy, innerR * 2, {
            roughness: 0.8,
            fill: 'rgba(245,243,236,0.95)',
            fillStyle: 'solid',
            stroke,
            strokeWidth: 0.9,
        });

        // Center dot
        rc.circle(cx, cy, holeR * 2, {
            roughness: 0.7,
            fill,
            fillStyle: 'solid',
            stroke,
            strokeWidth: 0.7,
        });
    }, [hovered, size]);

    useEffect(() => { draw(); }, [draw]);

    return (
        <motion.button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title="Match History"
            whileHover={{ rotate: 30 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 120, damping: 10 }}
            style={{
                background: 'none',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <canvas ref={canvasRef} width={size} height={size} />
        </motion.button>
    );
};

export default SketchGearButton;
