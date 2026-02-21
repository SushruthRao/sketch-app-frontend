import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";

const SketchChatBox = ({
  messages,
  onSend,
  fps = 7,
  maxWidth = "80vw",
  maxHeight = "80vh",
  gameStarted = false,
  // eslint-disable-next-line no-unused-vars
  isDrawer = false,
  disabled = false,
}) => {
  const [text, setText] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const requestRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext("2d");
    let lastDrawTime = performance.now();
    const fpsInterval = 1000 / fps;

    const animate = (currentTime) => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsed = currentTime - lastDrawTime;

      if (elapsed > fpsInterval) {
        lastDrawTime = currentTime - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        rc.rectangle(5, 5, dimensions.width - 10, dimensions.height - 10, {
          roughness: 0.7,
          stroke: "#333",
          strokeWidth: 2,
          fill: "transparent",
        });
        rc.line(5, 50, dimensions.width - 5, 52, {
          roughness: 0.7,
          strokeWidth: 1.5,
        });
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dimensions, fps]);

  const getPlaceholder = () => {
    if (disabled) return "You're drawing! ...";
    if (!gameStarted) return "Write something...";
    return "Type your guess...";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div
      ref={containerRef}
      style={{ maxWidth: maxWidth, height: maxHeight }}
      className="relative w-full mx-auto flex flex-col"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 -z-10"
      />

      <div className="flex flex-col h-full p-4 overflow-hidden">
        <h3
          className="h-8 sticky text-xl font-bold text-center mb-2"
          style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
        >
          Chat !  
        </h3>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar"
        >
          {messages.map((msg, i) =>
            msg.isSystem && msg.isCorrectGuess ? (
              <div
                key={i}
                className="flex justify-left mb-4 italic text-green-600 font-bold"
                style={{
                  fontFamily: "'Gloria Hallelujah', cursive",
                  fontSize: "0.9rem",
                }}
              >
                {msg.text}
              </div>
            ) : msg.isSystem ? (
              <div
                key={i}
                className="flex justify-left mb-4 italic text-red-600"
                style={{
                  fontFamily: "'Gloria Hallelujah', cursive",
                  fontSize: "0.9rem",
                }}
              >
                {msg.text}
              </div>
            ) : (
              <div
                key={i}
                className={`flex mb-4 ${msg.isMe ? "justify-end" : "justify-start"}`}
              >
                <div className="relative px-4 py-2 max-w-[85%] font-mono text-sm">
                  <span
                    className="relative z-10 sketch-message"
                    style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
                    title={msg.text}
                  >
                    {msg.username && !msg.isMe && (
                      <span className="font-bold text-gray-700">{msg.username}: </span>
                    )}
                    {msg.text}
                  </span>
                  <div
                    className="absolute inset-0 -z-10 border-2 border-black"
                    style={{
                      borderRadius:
                        "255px 15px 225px 15px/15px 225px 15px 255px",
                      backgroundColor: msg.isMe
                        ? "rgba(25, 99, 183, 0.15)"
                        : "#f9f9f9",
                      transform: `rotate(${i % 2 === 0 ? 0.5 : -0.5}deg)`,
                    }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
        <form onSubmit={handleSubmit} className="relative h-12 shrink-0">
          <input
            value={disabled ? getPlaceholder() : text}
            onChange={(e) => !disabled && setText(e.target.value)}
            maxLength={250}
            disabled={disabled}
            className={`sketch-input w-full h-full bg-transparent px-4 border-2 border-black outline-none ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
            placeholder={getPlaceholder()}
            style={{
              borderRadius: "150px 15px 100px 15px/15px 100px 15px 150px",
              fontFamily: "'Gloria Hallelujah', cursive",
            }}
          />

          {!disabled && (
            <button
              type="submit"
              className="absolute right-4 top-2 text-xl hover:scale-125 transition-transform"
            >
              ✏️
            </button>
          )}
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .sketch-input::placeholder { font-family: 'Gloria Hallelujah', cursive; }
      `}</style>
    </div>
  );
};

export default SketchChatBox;