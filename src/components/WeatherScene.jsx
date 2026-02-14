import React, { useState } from "react";
import CloudComponent from "./CloudComponent";
import SunSvg from "../assets/Happy_Stick_Figure_Sun.svg";

const WeatherScene = ({ width = "400px", height = "400px", sunSize = 160 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const toggleHover = (state) => setIsHovered(state);

  return (
    <div
      style={{
        position: "relative",
        width: width,
        height: height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        overflow: "hidden",
        pointerEvents: "none",
        // Force a fresh stacking context for the whole scene
        isolation: "isolate", 
      }}
    >
      {/* 1. SUN SVG - Lowest Z-Index */}
      <div 
        onMouseEnter={() => toggleHover(true)}
        onMouseLeave={() => toggleHover(false)}
        style={{
          width: `${sunSize}px`,
          height: `${sunSize}px`,
          position: "relative",
          zIndex: 1, 
          transform: isHovered ? "scale(1.3) rotate(10deg)" : "scale(1) rotate(0deg)",
          transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      >
        <img src={SunSvg} alt="Sun" style={{ width: "100%", height: "100%" }} />
      </div>

      {/* 2. LEFT CLOUD - Middle Z-Index */}
      <div
        onMouseEnter={() => toggleHover(true)}
        onMouseLeave={() => toggleHover(false)}
        style={{
          position: "absolute",
          left: "50%",
          zIndex: 10, // Significantly higher to break stacking context issues
          transform: `translateX(${isHovered ? "-320px" : "-180px"}) translateY(-20px)`,
          transition: `transform 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${isHovered ? "0s" : "0.1s"}`,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      >
        <div className="cloud-bob-1">
          <CloudComponent width={sunSize * 1.4} isOpen={!isHovered} />
        </div>
      </div>

      {/* 3. RIGHT CLOUD - Highest Z-Index */}
      <div
        onMouseEnter={() => toggleHover(true)}
        onMouseLeave={() => toggleHover(false)}
        style={{
          position: "absolute",
          left: "50%",
          zIndex: 20, // Highest
          transform: `translateX(${isHovered ? "140px" : "20px"}) translateY(10px)`,
          transition: `transform 1s cubic-bezier(0.4, 0, 0.2, 1) ${isHovered ? "0.05s" : "0.2s"}`,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      >
        <div className="cloud-bob-2">
          <CloudComponent width={sunSize * 1.5} isOpen={!isHovered} />
        </div>
      </div>

      <style>{`
        @keyframes scene-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .cloud-bob-1 { animation: scene-bob 4.5s ease-in-out infinite; }
        .cloud-bob-2 { animation: scene-bob 6s ease-in-out infinite reverse; }
      `}</style>
    </div>
  );
};

export default WeatherScene;
