/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import SketchTitleComponent from "../components/SketchTitleComponent";
import SketchLoader from "../components/SketchLoader";
import { Flip, toast, ToastContainer } from "react-toastify";
import SketchToast from "../toast/SketchToast";
import { useToast } from "../toast/CustomToastHook";
import SketchTitleText from "../components/SketchTitleText";
import SketchChatBox from "../components/SketchChatBox";
import Whiteboard from "../components/Whiteboard";
import WhiteboardColorSelect from "../components/WhiteBoardColorSelect";
import SketchClipboard from "../components/SketchClipboard";
import Scene from "../components/PencilScene";
import CloudComponent from "../components/CloudComponent";
import WeatherScene from "../components/WeatherScene";
import BackgroundCanvasFill from "../components/BackgroundCanvasFill";
import PencilScene from "../components/PencilScene";
import AnimatedPencilWithBackground from "../components/AnimatedPencilWithBackground";
import { Cloud } from "@react-three/drei";


const notify = () => {
  toast(
    ({ closeToast, isPaused, toastProps, isErrorToast }) => (
      <SketchToast
        text="Sketch Toast!"
        closeToast={closeToast}
        isPaused={isPaused}
        isError={isErrorToast}
        toastProps={toastProps}
      />
    ),
    {
      autoClose: 3000,
      customProgressBar: true,
      hideProgressBar: true,
      pauseOnFocusLoss: false,
      pauseOnHover: false,
      style: { background: "transparent", boxShadow: "none" },
    },
  );
};

const RoughBackground = ({
  width = 400,
  height = 400,
  text = " > Login",
  color = "rgba(25, 99, 183, 0.52)",
  stroke = "#000",
  strokeWidth = 1,
  fps = 8,
}) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const timeRef = useRef(0);
  const fpsInterval = 1000 / fps;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext("2d");
    let lastDrawTime = performance.now();

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dynamicRoughness = Math.abs(Math.sin(timeRef.current)) * 2;
        const padding = 5;
        rc.rectangle(
          padding,
          padding,
          canvas.width - padding * 2,
          canvas.height - padding * 2,
          {
            roughness: dynamicRoughness,
            fill: color,
            fillStyle: "hachure",
            stroke: stroke,
            strokeWidth: strokeWidth,
            hachureGap: 6,
          },
        );
        const fontSize = Math.min(canvas.width * 0.2, canvas.height * 0.5);
        ctx.font = `${fontSize}px 'Gloria Hallelujah'`;
        ctx.fillStyle = stroke;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        timeRef.current += 0.07;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [fpsInterval, color, stroke, strokeWidth, text]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: "block" }}
    />
  );
};

export const Test = () => {
  const [messages, setMessages] = useState([
    { text: "Hello !", isMe: false },
    { text: "Test 1234", isMe: true },
    { text: "Hello !", isMe: false },
    { text: "Test 1234", isMe: true },
    { text: "Hello !", isMe: false },
    { text: "Test 1234", isMe: true },
    { text: "Hello !", isMe: false },
    { text: "Test 1234", isMe: true },
    { text: "Hello !", isMe: false },
    { text: "Test 1234", isMe: true },
    { text: "Hello !", isMe: false },
    { text: "Server announcement", isSystem: true },
    { text: "Hello !", isMe: false },
    { text: "Test 1234", isMe: true },
  ]);
  const { showSuccessToast, showErrorToast } = useToast();
  return (
    <div className="p-10 space-y-4">
      <div className="relative inline-block">
        {/* <RoughBackground width={300} height={150} strokeWidth={1.1} text=" Hello" />
        <RoughBackground width={120} height={80} strokeWidth={1.1} text="Login" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-bold text-xl">Thin Outline</span>
        </div>
        <SketchTitleComponent/>
         
        <SketchBrushIcon/> */}
        {/* <SketchTitleText/> */}
        {/* <button onClick={() => showErrorToast("Error Toast")}>Trigger Success Sketch Toast</button>
         <button onClick={() => showSuccessToast("Success Toast")}>Trigger Success Sketch Toast</button>
        <ToastContainer  draggable={true}/>
        <SketchChatBox messages={messages}/> */}

        {/* <div className="flex-1 w-full flex items-center static justify-center overflow-hidden mt-3">
          <div className="absolute top-10 bg-red-400 z-99">Guess Word</div>
          <Whiteboard roomCode={99} isDrawer={true} />
        </div> */}
        {/* <WeatherScene/>
        <CloudComponent/>
        <Scene/>
          <SketchClipboard/> */}
          {/* <Whiteboard isDrawer={true}/> */}
          <AnimatedPencilWithBackground />
          <CloudComponent/>
        {/* <SketchLoader/> */}
        {/* <SmileIcon/> */}
      </div>
    </div>
  );
};
