import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface TypingRaceProps {
  room: {
    _id: Id<"rooms">;
    status: "lobby" | "countdown" | "in_progress" | "finished";
    endTime?: number;
    startTime?: number;
    text: string;
  };
  player: {
    _id: Id<"players">;
    isHost: boolean;
  };
  players: Array<{
    _id: Id<"players">;
    name: string;
    isHost: boolean;
    finishTime?: number;
  }>;
  progress: Record<string, { currentWord: number }>;
  text: string;
  isHost?: boolean;
  onRestart: () => void;
}

const carImages = [
  "/blueCar.png",
  "/greenCar.png",
  "/redCar.png",
  "/yellowCar.png",
  "/whiteCar.png",
];

const getCarImageForPlayer = (
  playerId: string,
  players: Array<{ _id: string }>
) => {
  const sortedIds = [...players].map((p) => p._id).sort();
  const index = sortedIds.indexOf(playerId);
  return carImages[index % carImages.length];
};

export function TypingRace({
  room,
  player,
  players,
  progress,
  text,
  isHost,
  onRestart,
}: TypingRaceProps) {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [currentWord, setCurrentWord] = useState(0);
  const [finished, setFinished] = useState(false);
  const [locked, setLocked] = useState(false);
  const timeLeftRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(
    room.endTime
      ? Math.max(0, Math.floor((room.endTime - Date.now()) / 1000))
      : 0
  );

  const updateProgress = useMutation(api.progress.updateProgress);
  const finishPlayer = useMutation(api.progress.finishPlayer);
  const finishGame = useMutation(api.rooms.finishGame);

  const words = text.split(" ");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (room.status === "in_progress" && isHost) {
      const allFinished = players.every((p) => p.finishTime !== undefined);
      if (allFinished) {
        finishGame({ roomId: room._id });
      }
    }
  }, [room.status, players, room._id, finishGame, isHost]);

  useEffect(() => {
    if (!room.endTime) return;

    let frameId: number;
    let mounted = true;

    const updateTimer = () => {
      if (!mounted) return;

      const newTimeLeft = Math.max(
        0,
        Math.floor((room.endTime! - Date.now()) / 1000)
      );
      if (newTimeLeft !== timeLeftRef.current) {
        timeLeftRef.current = newTimeLeft;
        setTimeLeft(newTimeLeft);
      }

      if (newTimeLeft > 0) {
        frameId = requestAnimationFrame(updateTimer);
      }
    };

    updateTimer();

    return () => {
      mounted = false;
      cancelAnimationFrame(frameId);
    };
  }, [room.endTime]);

  useEffect(() => {
    if (finished || locked) return;
    if (input === "" || input.endsWith(" ")) {
      const timeout = setTimeout(() => {
        updateProgress({
          roomId: room._id,
          playerId: player._id,
          currentWord,
          input,
        });
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [
    input,
    currentWord,
    finished,
    locked,
    updateProgress,
    room._id,
    player._id,
  ]);

  useEffect(() => {
    if (started && !finished && !locked) inputRef.current?.focus();
  }, [started, finished, locked]);

  useEffect(() => {
    if (finished && !locked) {
      setLocked(true);
      finishPlayer({ playerId: player._id });
    }
  }, [finished, locked, finishPlayer, player._id]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.endsWith(" ")) {
      if (val.trim() === words[currentWord]) {
        const nextWord = currentWord + 1;
        setCurrentWord(nextWord);
        setInput("");

        if (nextWord === words.length) {
          setFinished(true);
          updateProgress({
            roomId: room._id,
            playerId: player._id,
            currentWord: nextWord,
            input: "",
          });
        }
      }
    } else {
      setInput(val);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && input.length === 0 && currentWord > 0)
      e.preventDefault();
  }

  useEffect(() => {
    setStarted(room.status === "in_progress");
  }, [room.status]);

  const sortedPlayers = [...players].sort((a, b) => {
    const aFinished = a.finishTime !== undefined;
    const bFinished = b.finishTime !== undefined;
    if (aFinished && bFinished)
      return (a.finishTime || 0) - (b.finishTime || 0);
    if (aFinished) return -1;
    if (bFinished) return 1;
    const aProgress = progress[a._id]?.currentWord || 0;
    const bProgress = progress[b._id]?.currentWord || 0;
    return bProgress - aProgress;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-center grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl">
          <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gray-800 rounded-full">
            ⏱️
          </div>
          <div>
            <div className="text-sm text-gray-400">الوقت المتبقي</div>
            <div className="font-mono text-2xl font-bold">
              {Math.floor(timeLeft)}ث
            </div>
          </div>
        </div>

        <div className="text-center">
          {finished ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-full animate-pulse">
              <span>🏁</span>
              <span className="font-bold">انتهيت!</span>
            </div>
          ) : started ? (
            <div className="font-bold text-yellow-400">السباق جاري!</div>
          ) : (
            <div className="text-gray-500">استعد...</div>
          )}
        </div>

        <div className="text-right">
          {room.status === "in_progress" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg">
              <span className="text-gray-400">المركز:</span>
              <span className="font-bold">
                {sortedPlayers.findIndex((p) => p._id === player._id) + 1}/
                {players.length}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="p-4 overflow-x-hidden text-base leading-relaxed text-white bg-gray-900 select-none sm:p-6 sm:text-lg rounded-xl">
          {words.map((word, idx) => (
            <span
              key={idx}
              className={`inline-block mr-1 ${
                idx < currentWord ? "text-green-400" : ""
              } ${
                idx === currentWord
                  ? "bg-yellow-500/20 text-yellow-400 px-1 rounded"
                  : ""
              } ${idx > currentWord ? "text-gray-500" : ""}`}
            >
              {word}
            </span>
          ))}
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            className={`w-full bg-gray-900 text-white text-base px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 ${
              started && !finished && !locked
                ? "focus:ring-yellow-500"
                : "focus:ring-gray-700"
            } ${finished ? "bg-green-500/20" : ""} ${
              locked ? "bg-gray-800" : ""
            } appearance-none`}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={finished || locked || !started}
            placeholder={started ? "اكتب هنا..." : "بانتظار البدء..."}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            autoFocus
          />
          <div className="absolute text-2xl -translate-y-1/2 left-4 top-1/2">
            {finished ? "🏁" : "⌨️"}
          </div>
        </div>
      </div>

      {room.status === "finished" && isHost && (
        <button
          className="flex items-center gap-2 px-6 py-3 mx-auto mt-4 text-lg font-bold text-white transition bg-yellow-500 rounded-full shadow hover:bg-yellow-600 hover:scale-105 active:scale-95"
          onClick={onRestart}
        >
          🔄 سباق جديد!
        </button>
      )}

      <div className="relative w-full h-full max-h-[400px] bg-gray-900 rounded-xl p-4">
        <div
          className="relative"
          style={{ height: `${sortedPlayers.length * 112}px` }}
        >
          {sortedPlayers.map((p, index) => {
            const playerProgress = progress[p._id]?.currentWord || 0;
            const totalWords = words.length;
            const progressPercent = Math.min(
              (playerProgress / totalWords) * 100,
              100
            );
            const isCurrentUser = p._id === player._id;
            const position = index + 1;

            return (
              <div
                key={p._id}
                className="absolute w-full space-y-1 transition-all duration-500 ease-in-out"
                style={{
                  transform: `translateY(${index * 112}px)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        isCurrentUser ? "text-yellow-400" : "text-white"
                      }`}
                    >
                      #{position} {p.name} {p.isHost && "👑"}
                    </span>
                    {p.finishTime && room.startTime && (
                      <span className="text-green-400">
                        أنهى السباق!{" "}
                        {((p.finishTime - room.startTime) / 1000).toFixed(1)}ث
                      </span>
                    )}
                  </div>
                  <span className="text-white">
                    {p.finishTime ? "100.0" : progressPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="relative w-full h-10 overflow-hidden bg-black rounded-full">
                  <div
                    className="absolute inset-0 bg-repeat-x bg-[length:auto_100%]"
                    style={{ backgroundImage: "url('/rotated_road.png')" }}
                  />
                  {!p.finishTime && (
                    <div
                      className="absolute top-0 bottom-0 right-0 transition-all duration-300 ease-out bg-black/80"
                      style={{
                        width: `${100 - progressPercent}%`,
                        borderTopRightRadius: "9999px",
                        borderBottomRightRadius: "9999px",
                      }}
                    />
                  )}
                  <div
                    className="absolute transition-all duration-300 top-1/2"
                    style={{
                      left: `${progressPercent}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <img
                      src={getCarImageForPlayer(p._id, players)}
                      alt="سيارة"
                      className="object-contain w-8 h-8"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
