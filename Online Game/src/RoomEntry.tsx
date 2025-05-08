import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function RoomEntry({
  onEnter,
}: {
  onEnter: (roomId: string, playerId: string) => void;
}) {
  const createRoom = useMutation(api.functions.createRoom);
  const joinRoom = useMutation(api.functions.joinRoom);

  const [hostName, setHostName] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  return (
    <div>
      <h2>إنشاء غرفة</h2>
      <input
        placeholder="اسمك"
        value={hostName}
        onChange={(e) => setHostName(e.target.value)}
        style={{ direction: "rtl", textAlign: "right" }}
      />
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        style={{ direction: "rtl", textAlign: "right" }}
      >
        <option value="Easy">سهل</option>
        <option value="Medium">متوسط</option>
        <option value="Hard">صعب</option>
      </select>
      <button
        disabled={!hostName}
        onClick={async () => {
          const { roomId, playerId } = await createRoom({
            hostName,
            difficulty: difficulty as "Easy" | "Medium" | "Hard",
          });
          onEnter(roomId as string, playerId as string);
        }}
      >
        إنشاء
      </button>
      <h2>دخول غرفة</h2>
      <input
        placeholder="معرّف الغرفة"
        value={joinRoomId}
        onChange={(e) => setJoinRoomId(e.target.value)}
        style={{ direction: "rtl", textAlign: "right" }}
      />
      <input
        placeholder="اسمك"
        value={joinName}
        onChange={(e) => setJoinName(e.target.value)}
        style={{ direction: "rtl", textAlign: "right" }}
      />
      <button
        disabled={!joinRoomId || !joinName}
        onClick={async () => {
          setJoinError(null);
          try {
            // Convex expects an Id object, not a string
            const { playerId } = await joinRoom({
              roomId: joinRoomId as Id<"rooms">,
              name: joinName,
            });
            onEnter(joinRoomId, playerId as string);
          } catch (e) {
            setJoinError("فشل في الدخول. تحقق من معرف الغرفة.");
          }
        }}
      >
        دخول
      </button>
      {joinError && <div style={{ color: "red" }}>{joinError}</div>}
    </div>
  );
}
