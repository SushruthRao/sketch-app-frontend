import React, { useEffect, useState } from "react";
import timer from "../assets/timer_transparent_bg.png";

const CountdownTimer = ({ endTime, enableIcon=false }) => {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor((endTime - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, timeLeft]);

  if (timeLeft <= 0) return null;

  if (!enableIcon) {
  return (
    <span className="text-red-500 text-sm font-bold">
      ({timeLeft}s)
    </span>
  );
}
else{
    return (
    <div className="relative inline-block w-10 h-10 overflow-hidden align-middle md:w-14 md:h-14">
      <img
        src={timer}
        alt="Timer"
        className="w-full h-full object-contain block"
      />
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-[12px] md:text-[15px] font-black tabular-nums whitespace-nowrap transition-colors duration-300 ${
          timeLeft < 15 ? "text-red-500" : "text-black"
        }`}
      >
        {timeLeft}s
      </span>
    </div>
  );
}
  
};

export default CountdownTimer;

