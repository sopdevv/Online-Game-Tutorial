import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { TypingGame } from "./TypingGame";
import { Id } from "../convex/_generated/dataModel";

export function RoomLobby({
  roomId,
  playerId,
  onLeave,
}: {
  roomId: string;
  playerId: string;
  onLeave: () => void;
}) {
  const roomIdObj = roomId as Id<"rooms">;
  const playerIdObj = playerId as Id<"players">;

  const room = useQuery(
    api.functions.getRoom,
    roomId ? { roomId: roomIdObj } : "skip"
  );
  const players = useQuery(
    api.functions.listPlayers,
    roomId ? { roomId: roomIdObj } : "skip"
  );
  const leaveRoom = useMutation(api.functions.leaveRoom);
  const startGame = useMutation(api.functions.startGame);
  const restartGame = useMutation(api.functions.restartGame);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const DIFFICULTY_TIMES: Record<string, number> = {
    Easy: 60,
    Medium: 180,
    Hard: 300,
  };

  useEffect(() => {
    if (room) {
      setGameStarted(room.started);
      setGameEnded(room.ended);
    }
  }, [room]);

  const me = players?.find((p) => p._id === playerIdObj);

  if (!room || !players || !me) return <div>جار التحميل...</div>;

  if (gameStarted || gameEnded) {
    return (
      <TypingGame
        roomId={roomId}
        playerId={playerId}
        onFinish={async () => {
          if (me.isHost) {
            await restartGame({ roomId: roomIdObj });
          }
        }}
      />
    );
  }

  return (
    <div>
      <h2>الغرفة: {roomId}</h2>
      <div>
        <b>الصعوبة:</b>{" "}
        {room.difficulty === "Easy"
          ? "سهل"
          : room.difficulty === "Medium"
            ? "متوسط"
            : "صعب"}{" "}
        ({DIFFICULTY_TIMES[room.difficulty]} ثانية)
      </div>
      <div>
        <b>اللاعبون:</b>
        <ul>
          {players.map((p) => (
            <li key={p._id as string}>
              {p.name} {p.isHost ? "(المضيف)" : ""}
            </li>
          ))}
        </ul>
      </div>
      {me.isHost && !gameStarted && (
        <button onClick={() => startGame({ roomId: roomIdObj })}>
          بدء اللعبة
        </button>
      )}
      <button
        onClick={async () => {
          await leaveRoom({ playerId: playerIdObj });
          onLeave();
        }}
      >
        مغادرة الغرفة
      </button>
      {gameEnded && <div>انتهت اللعبة! انتظر إعادة التشغيل من المضيف.</div>}
    </div>
  );
}
