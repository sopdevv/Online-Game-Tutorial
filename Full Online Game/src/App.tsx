import React, { useEffect, useMemo, useState } from "react";
import { RoomForm } from "./components/RoomForm";
import { JoinForm } from "./components/JoinForm";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { TypingRace } from "./components/TypingRace";
import { Countdown } from "./components/Countdown";
import { Id } from "../convex/_generated/dataModel";

function getSessionId() {
  let id = localStorage.getItem("sessionId");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem("sessionId", id);
  }
  return id;
}

export default function App() {
  const [view, setView] = useState<"home" | "lobby" | "race">("home");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJoinPopup, setShowJoinPopup] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromURL = params.get("room");
    if (codeFromURL) {
      setRoomCode(codeFromURL.toUpperCase());
      setShowJoinPopup(true);
    }
  }, []);

  const room = useQuery(
    api.rooms.getRoom,
    roomCode ? { code: roomCode } : "skip"
  );
  const players = useQuery(api.rooms.listPlayers, roomId ? { roomId } : "skip");
  const progressList = useQuery(
    api.progress.getProgress,
    roomId ? { roomId } : "skip"
  );

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const startGame = useMutation(api.rooms.startGame);
  const setInProgress = useMutation(api.rooms.setInProgress);
  const finishGame = useMutation(api.rooms.finishGame);
  const restartGame = useMutation(api.rooms.restartGame);

  const progressMap = useMemo(() => {
    const map: Record<string, { currentWord: number }> = {};
    if (progressList) {
      for (const p of progressList) {
        map[p.playerId] = { currentWord: p.currentWord };
      }
    }
    return map;
  }, [progressList]);

  async function handleCreate({
    name,
    duration,
  }: {
    name: string;
    duration: number;
  }) {
    try {
      setError(null);
      const sessionId = getSessionId();
      const res = await createRoom({ sessionId, name, duration });
      setRoomCode(res.code);
      setRoomId(res.roomId);
      setPlayerId(res.playerId);
      setPlayerName(name);
      setView("lobby");
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    }
  }

  async function handleJoin({ code, name }: { code: string; name: string }) {
    try {
      setError(null);
      const sessionId = getSessionId();
      const res = await joinRoom({ code, sessionId, name });
      setRoomCode(code);
      setRoomId(res.roomId);
      setPlayerId(res.playerId);
      setPlayerName(name);
      setView("lobby");
      setShowJoinPopup(false);
    } catch (err: any) {
      setError(err.message || "Failed to join room");
    }
  }

  async function handleStart() {
    if (!roomId) return;
    try {
      setError(null);
      await startGame({ roomId, sessionId: getSessionId() });
    } catch (err: any) {
      setError(err.message || "Failed to start game");
    }
  }

  async function handleRestart() {
    if (!roomId) return;
    try {
      setError(null);
      await restartGame({ roomId, sessionId: getSessionId() });
    } catch (err: any) {
      setError(err.message || "Failed to restart game");
    }
  }

  useEffect(() => {
    if (room && room.status === "countdown" && room.startTime) {
      const timeout = setTimeout(
        () => {
          setInProgress({ roomId: room._id }).catch((err: any) => {
            if (
              typeof err?.message === "string" &&
              err.message.includes("Not in countdown")
            ) {
            } else {
              console.error(err);
            }
          });
        },
        Math.max(0, room.startTime - Date.now())
      );
      return () => clearTimeout(timeout);
    }
  }, [room, setInProgress]);

  useEffect(() => {
    if (room && room.status === "in_progress" && room.endTime) {
      const timeout = setTimeout(
        () => {
          finishGame({ roomId: room._id });
        },
        Math.max(0, room.endTime - Date.now())
      );
      return () => clearTimeout(timeout);
    }
  }, [room, finishGame]);

  const player = useMemo(
    () => players?.find((p) => p._id === playerId),
    [players, playerId]
  );
  const isHost = player?.isHost;
  const shareLink = roomCode
    ? `${window.location.origin}?room=${roomCode}`
    : "";

  if (view === "lobby" && room && players && player) {
    return (
      <div
        dir="rtl"
        className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900"
      >
        <div className="flex flex-col w-full max-w-3xl gap-6 p-6 bg-gray-800 rounded-lg shadow-xl">
          <div className="text-center">
            <h2 className="mb-2 text-3xl font-bold">
              غرفة السباق:{" "}
              <span className="font-mono text-yellow-400">{room.code}</span>
            </h2>

            <div className="mb-4 text-sm text-gray-400">
              شارك الكود أو الرابط مع أصدقائك! اضغط على الرابط لنسخه:
              <br />
              <div className="mt-4 text-center">
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-4 py-2 mx-auto font-mono text-sm text-white transition bg-gray-700 rounded cursor-pointer w-fit hover:bg-gray-600"
                  title="اضغط للنسخ"
                >
                  {shareLink}
                </div>
                {copied && (
                  <div className="mt-1 text-sm text-green-400 animate-pulse">
                    تم النسخ!
                  </div>
                )}
              </div>
              <div className="mt-6 text-center">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  المتسابقون:
                </h3>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {players.map((p) => (
                    <span
                      key={p._id}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-white bg-gray-700 rounded-full"
                    >
                      {p.name}
                      {p.isHost && (
                        <span className="text-xs font-semibold text-yellow-400">
                          (المضيف)
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isHost && room.status === "lobby" && (
            <button
              className="px-6 py-3 text-lg font-bold text-white transition transform bg-green-500 rounded-full shadow-lg hover:bg-green-600 hover:scale-105 active:scale-95"
              onClick={handleStart}
            >
              🏁 ابدأ السباق الآن!
            </button>
          )}

          {!isHost && room.status === "lobby" && (
            <div className="text-center text-gray-400">
              🔄 ننتظر المضيف ليبدأ السباق...
            </div>
          )}

          {room.status === "countdown" && room.startTime && (
            <div className="text-center">
              <Countdown startTime={room.startTime} onDone={() => {}} />
            </div>
          )}

          {room.status === "in_progress" || room.status === "finished" ? (
            <TypingRace
              room={room}
              player={player}
              players={players}
              progress={progressMap}
              text={room.text}
              isHost={isHost}
              onRestart={handleRestart}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900"
    >
      {showJoinPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-center text-white">
              انضم للسباق
            </h2>
            <JoinForm onJoin={handleJoin} defaultCode={roomCode || ""} />
          </div>
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text">
            سباق الطباعة السريعة
          </h1>
          <p className="text-gray-400">اختبر سرعتك في الكتابة وتحدى أصدقاءك!</p>
        </div>

        {error && (
          <div className="p-4 mb-6 text-center text-red-400 border border-red-500 rounded-lg bg-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <RoomForm onCreate={handleCreate} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-400 bg-gray-800">
                أو انضم لغرفة سباق موجودة
              </span>
            </div>
          </div>
          <JoinForm onJoin={handleJoin} />
        </div>
      </div>
    </div>
  );
}
