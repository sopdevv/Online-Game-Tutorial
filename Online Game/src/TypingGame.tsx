import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function TypingGame({
  roomId,
  playerId,
  onFinish,
}: {
  roomId: string;
  playerId: string;
  onFinish: () => void;
}) {
  const roomIdObj = roomId as Id<"rooms">;
  const playerIdObj = playerId as Id<"players">;

  const room = useQuery(
    api.functions.getRoom,
    roomId ? { roomId: roomIdObj } : "skip"
  );
  const progress = useQuery(
    api.functions.getProgress,
    roomId ? { roomId: roomIdObj } : "skip"
  );
  const submitWord = useMutation(api.functions.submitWord);
  const finishGame = useMutation(api.functions.finishGame);

  const [input, setInput] = useState("");
  const [words, setWords] = useState<string[]>([]);

  const DIFFICULTY_TIMES: Record<string, number> = {
    Easy: 60,
    Medium: 180,
    Hard: 300,
  };

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (room?.sentence) {
      setWords(room.sentence.split(" "));
    }
  }, [room?.sentence]);

  const player = progress?.find((p) => p._id === playerIdObj);
  const totalWords = words.length;
  const playerProgress = player?.progress ?? 0;

  useEffect(() => {
    if (room?.started && room?.difficulty && timeLeft === null) {
      setTimeLeft(DIFFICULTY_TIMES[room.difficulty]);
    }
  }, [room?.started, room?.difficulty, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || finished) return;
    if (timeLeft <= 0) {
      setFinished(true);
      finishGame({ roomId: roomIdObj });
      return;
    }
    const interval = setInterval(
      () => setTimeLeft((t) => (t !== null ? t - 1 : null)),
      1000
    );
    return () => clearInterval(interval);
  }, [timeLeft, finished, finishGame, roomIdObj]);

  useEffect(() => {
    if (finished || !room?.started) return;
    const allPlayersFinished = progress?.every(
      (p) => p.progress === totalWords
    );
    if (allPlayersFinished) {
      setFinished(true);
      finishGame({ roomId: roomIdObj });
    }
  }, [progress, totalWords, finished, finishGame, roomIdObj, room?.started]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setInput(e.target.value);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === " " || e.key === "Enter") && input.trim() !== "") {
      const currentWord = words[playerProgress];
      if (input.trim() === currentWord) {
        submitWord({ playerId: playerIdObj });
        setInput("");
      }
    }
  };

  const sortedProgress = [...(progress ?? [])].sort((a, b) => {
    const aDone = a.finishTime !== undefined;
    const bDone = b.finishTime !== undefined;
    if (aDone && bDone) {
      return a.finishTime! - b.finishTime!;
    }
    if (aDone !== bDone) {
      return aDone ? -1 : 1;
    }
    return b.progress - a.progress;
  });
  const winner = sortedProgress[0];

  return (
    <div>
      <div>
        <b>الجملة:</b>{" "}
        {words.map((word, idx) => {
          let color = "white";
          if (idx < playerProgress) color = "green";
          else if (idx === playerProgress) color = "yellow";
          return (
            <span
              key={idx}
              style={{
                color,
                fontWeight: idx === playerProgress ? "bold" : undefined,
                marginRight: 4,
              }}
            >
              {word}{" "}
            </span>
          );
        })}
      </div>
      <div>
        <input
          autoFocus
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={playerProgress >= totalWords || finished}
          style={{ direction: "rtl", textAlign: "right" }}
        />
      </div>
      <div>
        <b>تقدمك:</b> {playerProgress} / {totalWords}
      </div>
      <div>
        <b>الوقت المتبقي:</b>{" "}
        {timeLeft !== null
          ? timeLeft
          : DIFFICULTY_TIMES[room?.difficulty ?? "Easy"]}{" "}
        ث
      </div>
      <div>
        <b>لوحة الصدارة:</b>
        <ul>
          {sortedProgress.map((p, index) => (
            <li
              key={p._id as string}
              style={{
                fontWeight:
                  index === 0 || p.progress === totalWords ? "bold" : undefined,
                color:
                  index === 0
                    ? "gold"
                    : p.progress === totalWords
                      ? "green"
                      : undefined,
              }}
            >
              #{index + 1} {p.name} {p.isHost ? "(المضيف)" : ""}
              {index === 0 && p.progress === totalWords && " (الفائز)"}
              {p.progress === totalWords && index !== 0 && " (انتهى)"}
            </li>
          ))}
        </ul>
        {finished && (
          <div>
            {winner && (
              <div>
                <b>{winner.name} فاز!</b>
              </div>
            )}
            <div>انتهت اللعبة.</div>
            {player?.isHost && <button onClick={onFinish}>إعادة اللعبة</button>}
          </div>
        )}
      </div>
    </div>
  );
}
