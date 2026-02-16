import React, { lazy, Suspense, useRef, useState, useEffect, useCallback, useContext } from "react";
import rough from "roughjs";
import webSocketService from "../service/WebSocketService";
import canvasWebSocketService from "../service/CanvasWebSocketService";
import WhiteboardColorSelect from "./WhiteBoardColorSelect";
import SketchSlider from "./SketchSlider";
import { WHITEBOARD_CONFIG as CONFIG } from "../config/LabelConfig";
import AuthContext from "../auth/AuthContext";

const AnimatedPencilWithBackground = lazy(() => import("./AnimatedPencilWithBackground"));
const AnimatedEraserWithBackground = lazy(() => import("./AnimatedEraserWithBackground"));

const Whiteboard = ({ roomCode, isDrawer, isLobby = false }) => {
  const { username } = useContext(AuthContext);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);

  const borderRef = useRef(null);
  const borderCanvasRef = useRef(null);
  const [borderDimensions, setBorderDimensions] = useState({
    width: 0,
    height: 0,
  });

  const sendBufferRef = useRef([]);
  const throttleTimerRef = useRef(null);
  const lastSentPointRef = useRef(null);
  const lastDrawnPointRef = useRef(null);
  const isDrawerRef = useRef(isDrawer);
  const isLobbyRef = useRef(isLobby);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const lineWidthRef = useRef(lineWidth);

  const cursorUri =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABKUlEQVR4AeyQMWuDUBSFpUuLIGRr/4JDVt2dX8YiOHTqj9B2bvVHdOogSMe82V3XDP6FdgsI0m49p0ghvvtMAhkyRO6F884990PulXPi7wIUD7qC+zQ2NaS95m6oPM/7DILgPU3TFzY1PeAUWiwbULmu+1GW5W3TNIs8zx02NT3OQBOhIhB/8VZV1Y1S5g49zpgB1CgJuPJ9/5qLRno0OGMGT+OmEnAZRdEC4dkaM8tpSAJOM0e9JeCmruvtPsqY2UxzEnDddd2P1nqa/X9zxgyMNXqnJKDT9/1jHMffXNxJ40GPM2bwNEoEIqWHYbhPkuQrDMNtlmUOm5oeZ8ygjbIBGdT4i7u2bR+KonhmU9PD0HqPOSD2/op3eoViU0Pa6xCgfVuYnD/wFwAA///BpBG3AAAABklEQVQDAAYCbikpQT6ZAAAAAElFTkSuQmCC";

  useEffect(() => {
    isDrawerRef.current = isDrawer;
  }, [isDrawer]);

  useEffect(() => {
    isLobbyRef.current = isLobby;
  }, [isLobby]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    lineWidthRef.current = lineWidth;
  }, [lineWidth]);

  const clearCanvasLocal = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const renderStroke = useCallback((strokeData) => {
    const ctx = contextRef.current;
    if (!ctx || !strokeData.points || strokeData.points.length === 0) return;

    ctx.save();
    ctx.strokeStyle =
      strokeData.tool === "eraser" ? "#FFFFFF" : strokeData.color;
    ctx.lineWidth = strokeData.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";

    ctx.beginPath();
    ctx.moveTo(strokeData.points[0].x, strokeData.points[0].y);
    for (let i = 1; i < strokeData.points.length; i++) {
      ctx.lineTo(strokeData.points[i].x, strokeData.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    contextRef.current = ctx;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Sketch border resize observer
  useEffect(() => {
    if (!borderRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setBorderDimensions({ width, height });
    });
    observer.observe(borderRef.current);
    return () => observer.disconnect();
  }, []);

  // Sketch border drawing
  useEffect(() => {
    const canvas = borderCanvasRef.current;
    if (!canvas || borderDimensions.width === 0) return;
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rc.rectangle(5, 5, borderDimensions.width - 10, borderDimensions.height - 10, {
      roughness: 0.8,
      stroke: "#333",
      strokeWidth: 1.7,
      fill: "transparent",
    });
  }, [borderDimensions]);

  // Subscribe to draw topic — re-subscribes on canvas WS reconnect
  useEffect(() => {
    let subscription = null;

    const createSubscription = () => {
      if (subscription) {
        try { subscription.unsubscribe(); } catch (e) { /* already dead */ }
        subscription = null;
      }
      if (!canvasWebSocketService.connected) return;

      subscription = canvasWebSocketService.subscribeToDraw(roomCode, (data) => {
        if (data.senderUsername === username) return;
        if (data.type === "CANVAS_CLEAR") {
          clearCanvasLocal();
          return;
        }
        if (data.type === "STROKE") {
          renderStroke(data);
        }
      });
    };

    // Listen for connection/reconnection events to (re)subscribe
    const handleConnectionStatus = (status) => {
      if (status === true) {
        createSubscription();
      }
    };
    canvasWebSocketService.on("connectionStatus", handleConnectionStatus);

    // Subscribe immediately if already connected
    if (canvasWebSocketService.connected) {
      createSubscription();
    }

    return () => {
      canvasWebSocketService.off("connectionStatus", handleConnectionStatus);
      if (subscription) {
        try { subscription.unsubscribe(); } catch (e) { /* already dead */ }
      }
    };
  }, [roomCode, username, clearCanvasLocal, renderStroke]);

  // Canvas state restore + round clear — handles reconnect edge cases
  useEffect(() => {
    let canvasStateConnectionHandler = null;

    const handleCanvasState = (data) => {
      if (data.type === "CANVAS_STATE" && data.strokes) {
        clearCanvasLocal();
        data.strokes.forEach((stroke) => renderStroke(stroke));
      }
    };

    const handleRoomUpdate = (data) => {
      if (data.type === "ROUND_STARTED") {
        clearCanvasLocal();
      }
    };

    const requestState = () => {
      if (canvasWebSocketService.connected) {
        canvasWebSocketService.requestCanvasState(roomCode);
      }
    };

    canvasWebSocketService.on("canvasState", handleCanvasState);
    webSocketService.on("roomUpdate", handleRoomUpdate);

    // Check for buffered canvas state that arrived before this listener was registered
    const pending = canvasWebSocketService.consumePendingCanvasState();
    if (pending) {
      handleCanvasState(pending);
    }

    // Request canvas state — wait for connection if not yet connected
    if (canvasWebSocketService.connected) {
      requestState();
    } else {
      canvasStateConnectionHandler = (status) => {
        if (status === true) {
          requestState();
          canvasWebSocketService.off("connectionStatus", canvasStateConnectionHandler);
          canvasStateConnectionHandler = null;
        }
      };
      canvasWebSocketService.on("connectionStatus", canvasStateConnectionHandler);
    }

    return () => {
      canvasWebSocketService.off("canvasState", handleCanvasState);
      webSocketService.off("roomUpdate", handleRoomUpdate);
      if (canvasStateConnectionHandler) {
        canvasWebSocketService.off("connectionStatus", canvasStateConnectionHandler);
      }
    };
  }, [roomCode, clearCanvasLocal, renderStroke]);

  const flushSendBuffer = useCallback(() => {
    const buffer = sendBufferRef.current;
    if (buffer.length === 0) return;

    const points = lastSentPointRef.current
      ? [lastSentPointRef.current, ...buffer]
      : buffer;

    const strokeData = {
      type: "STROKE",
      tool: toolRef.current,
      color: toolRef.current === "eraser" ? "#FFFFFF" : colorRef.current,
      lineWidth: toolRef.current === "eraser" ? 20 : lineWidthRef.current,
      points: points,
    };
    canvasWebSocketService.sendDrawStroke(roomCode, strokeData);

    lastSentPointRef.current = buffer[buffer.length - 1];
    sendBufferRef.current = [];
  }, [roomCode]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX =
      e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
    const clientY =
      e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;

    return {
      x: Math.round((clientX - rect.left) * scaleX ) ,
      y: Math.round((clientY - rect.top) * scaleY ),
    };
  };

  const startDrawing = (e) => {
    if (!isDrawer) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const ctx = contextRef.current;

    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
    ctx.lineWidth = tool === "eraser" ? 20 : lineWidth;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    lastDrawnPointRef.current = coords;

    // Reset streaming state for new stroke
    sendBufferRef.current = [coords];
    lastSentPointRef.current = null;
    setIsDrawing(true);

    // Start periodic send timer
    throttleTimerRef.current = setInterval(() => {
      flushSendBuffer();
    }, CONFIG.canvas.sendInterval);
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawer) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const ctx = contextRef.current;
    const prev = lastDrawnPointRef.current;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastDrawnPointRef.current = coords;

    // Buffer the point for next throttled send
    sendBufferRef.current.push(coords);
  };

  const finishDrawing = () => {
    if (!isDrawing || !isDrawer) return;
    setIsDrawing(false);
    lastDrawnPointRef.current = null;

    // Stop periodic sending
    if (throttleTimerRef.current) {
      clearInterval(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }

    // Send any remaining buffered points
    flushSendBuffer();
    lastSentPointRef.current = null;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearInterval(throttleTimerRef.current);
      }
    };
  }, []);

  const handleClearCanvas = () => {
    clearCanvasLocal();
    canvasWebSocketService.sendCanvasClear(roomCode);
  };

  return (
    <>
      {isDrawer && (
        <div className="flex-[1] h-full min-w-[80px] hidden md:flex flex-col items-center justify-center">
          <Suspense fallback={<div className="w-full h-[52%]" />}>
            <AnimatedPencilWithBackground
              height="52%"
              width="100%"
              color={color}
              isSelected={tool === "pen"}
              onSelect={() => setTool("pen")}
            />
          </Suspense>

          <Suspense fallback={<div className="w-full h-[40%]" />}>
            <AnimatedEraserWithBackground
              height="40%"
              width="100%"
              color={color}
              isSelected={tool === "eraser"}
              onSelect={() => setTool("eraser")}
            />
          </Suspense>
        </div>
      )}
      <div className="flex-[4] h-full flex items-center justify-center">
        <div
          ref={borderRef}
          className="relative flex flex-col items-center gap-2 h-full overflow-hidden"
        >
          <canvas
            ref={borderCanvasRef}
            width={borderDimensions.width}
            height={borderDimensions.height}
            className="absolute inset-0 -z-10"
          />
          <div
            className="relative overflow-hidden bg-white mt-2 mx-2 flex-1 min-h-0"
            style={{
              width: "calc(100% - 16px)",
              maxWidth: "800px",
              aspectRatio: "4/3",
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block border-2"
              style={{
                cursor: isDrawer
                  ? tool === "eraser"
                    ? `url("${cursorUri}") 10 10, crosshair`
                    : `crosshair`
                  : "default",
                touchAction: "none",
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={finishDrawing}
              onMouseLeave={finishDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={finishDrawing}
            />
          </div>
          {!isDrawer && (
            <div className="shrink-0 flex items-center  rounded-lg font-gloria flex-wrap justify-center"></div>
          )}
          {isDrawer && (
            <div className="shrink-0 flex items-center gap-3 p-2 mb-2 mx-2 rounded-lg font-gloria flex-wrap justify-center">
              {/* Tool selector */}
              <div className="flex gap-1">
                <button
                  onClick={() => setTool("pen")}
                  className={`px-3 py-1 rounded border-2 transition-all text-sm ${
                    tool === "pen"
                      ? "border-black bg-gray-200 font-bold"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Pen
                </button>
                <button
                  onClick={() => setTool("eraser")}
                  className={`px-3 py-1 rounded border-2 transition-all text-sm ${
                    tool === "eraser"
                      ? "border-black bg-gray-200 font-bold"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Eraser
                </button>
              </div>

              {/* Color picker */}
              <div className="flex gap-1 flex-wrap">
                {CONFIG.colors.map((c) => (
                  <>
                    <WhiteboardColorSelect
                      onClick={() => {
                        setColor(c);
                        setTool("pen");
                      }}
                      isSelected={color == c ? true : false}
                      color={c}
                    />
                  </>
                ))}
              </div>

              {/* Line width */}
              <div className="flex items-center gap-1">
                <span className="text-xs">Size:</span>
                <SketchSlider
                  min={1}
                  max={10}
                  value={lineWidth}
                  onChange={(val) => setLineWidth(val)}
                />

                <span className="text-xs w-4">{lineWidth}</span>
              </div>

              {/* Clear canvas */}
              {!isLobby && (
                <button
                  onClick={handleClearCanvas}
                  className="px-3 py-1 rounded border-2 border-red-300 text-red-600 hover:bg-red-50 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Whiteboard;
