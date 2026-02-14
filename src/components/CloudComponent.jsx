/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";

const CloudComponent = ({
  width = 200,
  fps = 12,
  strokeWidth = 1.5,
  baseColor = "rgb(34, 159, 255)",
  outlineColor = "#000",
}) => {
  const canvasRef = useRef(null);
  const [viewParams, setViewParams] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const currentlyOpen = !isHovered
  const eyesOpen = [
    "m271.97 267.29a14.142 14.142 0 0 1 -28.284 0 14.142 14.142 0 1 1 28.284 0z",
    "m512.45 249.13a14.142 14.142 0 0 1 -28.284 0 14.142 14.142 0 1 1 28.284 0z",
  ];

  const eyesClosed = [
    "m269.91 215.97c-19.941-0.63629-39.393 11.352-53.625 36.281a3.6532 3.6532 0 1 0 6.3438 3.625c13.333-23.354 30.118-33.133 47.031-32.594 16.913 0.53967 34.722 11.708 49.219 32.844a3.6531 3.6531 0 1 0 6 -4.125c-15.395-22.444-35.028-35.395-54.969-36.031z",
    "m465.44 195.53c-19.941-0.63629-39.393 11.384-53.625 36.312a3.6532 3.6532 0 1 0 6.3438 3.625c13.333-23.354 30.15-33.165 47.062-32.625 16.913 0.53967 34.69 11.74 49.188 32.875a3.6623 3.6623 0 1 0 6.0312 -4.1562c-15.395-22.444-35.059-35.395-55-36.031z",
  ];

  const cloudPaths = [
    {
      d: "m346.27 0.04335c-49.326 0.018-96.447 31.944-115.69 77.062-32.492-23.427-77.994-21.843-112.46-3.5048-33.608 16.499-62.206 48.192-66.005 86.63-0.77792 10.213 1.1877 20.393 3.75 30.219-40.835 20.72-65.691 71.469-52.151 116.24 6.3322 20.418 21.324 37.584 39.901 47.698-15.577 25.558-25.565 58.051-15.113 87.434 11.44 29.491 44.266 45.839 74.925 44.503 16.772-0.0681 33.337-3.8896 49.062-9.5312 34.196 52.143 103.93 78.164 163.92 60.382 23.625-7.7025 44.881-22.894 59.173-43.226 46.635 31.732 110.74 31.15 159.91 5.375 33.67-18.249 59.81-53.439 61.238-92.53-1.2938-4.3736 3.9963-1.5124 6.2309-2.6884 61.631-6.7966 111.99-65.413 109.5-127.47 0.3828-5.6093-3.1171-13.312 3.0938-16.562 27.946-25.115 34.487-70.439 15.344-102.69-17.184-32.397-52.427-53.962-88.938-55.5-2.64-46.026-38.91-86.05-83.05-97.133-43.86-12.28-94.59 0.2327-125.88 33.453-20.9-25.334-54.08-39.076-86.75-38.157z",
      type: "body",
    },
    { d: currentlyOpen ? eyesOpen[0] : eyesClosed[0], type: "eye" },
    { d: currentlyOpen ? eyesOpen[1] : eyesClosed[1], type: "eye" },
    {
      d: "m443.24 319.67-9.25 2.125-0.625 0.78125c0.85555 10.787-0.00059 21.859-3.6875 32-5.2163 18.732-26.602 27.852-44.719 24.5-23.822-3.2956-39.605-25.585-45.469-47.25l-9.6562 2.2188c6.2028 21.718 18.999 42.51 40.375 51.281 20.053 7.7663 46.524 5.2441 60.562-12.219 11.579-14.961 14.026-34.809 12.469-53.438z",
      type: "mouth",
    },
    {
      d: "m267.66 385.17a32.857 32.857 0 1 1 -65.714 0 32.857 32.857 0 1 1 65.714 0z",
      type: "cheek",
    },
    {
      d: "m604.8 322.32a32.857 32.857 0 1 1 -65.714 0 32.857 32.857 0 1 1 65.714 0z",
      type: "cheek",
    },
  ];

  // Re-calculate BBox only if width changes (Eye state doesn't affect canvas size significantly)
  useEffect(() => {
    const svgNS = "http://www.w3.org/2000/svg";
    const tempSvg = document.createElementNS(svgNS, "svg");
    cloudPaths.forEach((p) => {
      const pathEl = document.createElementNS(svgNS, "path");
      pathEl.setAttribute("d", p.d);
      tempSvg.appendChild(pathEl);
    });
    document.body.appendChild(tempSvg);
    const fullBBox = tempSvg.getBBox();
    document.body.removeChild(tempSvg);

    const scale = width / fullBBox.width;
    const padding = 30; // Increased padding for rough strokes

    setViewParams({
      w: fullBBox.width * scale + padding,
      h: fullBBox.height * scale + padding,
      scale,
      x: -fullBBox.x * scale + padding / 2,
      y: -fullBBox.y * scale + padding / 2,
    });
  }, [width, isHovered]); // Added isOpen to ensure layout updates if paths shift

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewParams) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext("2d");


        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(viewParams.x, viewParams.y);
        ctx.scale(viewParams.scale, viewParams.scale);

        cloudPaths.forEach((p) => {
          let options = {
            stroke: outlineColor,
            strokeWidth: strokeWidth / viewParams.scale,
            roughness: 1,
          };

          if (p.type === "body") {
            options = { ...options, fill: baseColor, fillStyle: "hachure" };
          } else if (p.type === "eye" || p.type === "mouth") {
            // Fill solid for eyes and mouth
            options = { ...options, fill: outlineColor, fillStyle: "solid" };
          } else if (p.type === "cheek") {
            options = {
              ...options,
              fill: "rgba(255, 182, 193, 0.5)",
              stroke: "none",
              roughness: 2,
            };
          }

          rc.path(p.d, options);
        });

        ctx.restore();
      

  }, [
    viewParams,
    fps,
    baseColor,
    outlineColor,
    strokeWidth,
    isHovered,
    cloudPaths,
  ]);

  return (
    <canvas
      ref={canvasRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      width={viewParams?.w || 0}
      height={viewParams?.h || 0}
      style={{ background: "transparent", maxWidth: "100%" }}
    />
  );
};

export default CloudComponent;
