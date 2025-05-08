import React, { useEffect, useState } from "react";

export function Countdown({
  startTime,
  onDone,
}: {
  startTime: number;
  onDone: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.ceil((startTime - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = Math.max(
        0,
        Math.ceil((startTime - Date.now()) / 1000)
      );
      setTimeLeft(newTimeLeft);
      if (newTimeLeft === 0) {
        onDone();
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, onDone]);

  let display = timeLeft.toString();
  if (timeLeft === 0) display = "انطلق!";

  return (
    <div dir="rtl" className="flex flex-col items-center justify-center">
      <div className="mb-2 font-mono text-6xl font-bold">
        <div
          className={`
          transform transition-all duration-300
          ${timeLeft === 0 ? "scale-150 text-green-500" : "text-yellow-400"}
        `}
        >
          {display}
        </div>
      </div>
      <div className="text-xl text-gray-400">
        {timeLeft > 0 ? "استعد..." : ""}
      </div>
    </div>
  );
}
