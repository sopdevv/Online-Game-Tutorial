import React from "react";
import { Id } from "../../convex/_generated/dataModel";

interface PlayerListProps {
  players: Array<{
    _id: Id<"players">;
    name: string;
    isHost: boolean;
    finishTime?: number;
  }>;
  progress: Record<string, { currentWord: number }>;
  currentUserId: Id<"players">;
  textWords: string[];
}

export function PlayerList({
  players,
  progress,
  currentUserId,
  textWords,
}: PlayerListProps) {
  // Sort players by progress
  const sortedPlayers = [...players].sort((a, b) => {
    const aProgress = (progress[a._id]?.currentWord || 0) / textWords.length;
    const bProgress = (progress[b._id]?.currentWord || 0) / textWords.length;
    return bProgress - aProgress;
  });

  return (
    <div
      dir="rtl"
      className="relative w-full p-4 overflow-hidden bg-gray-800 rounded-lg"
    >
      {/* Race track background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InN0cmlwZXMiIHBhdGh0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0wIDIwaDQwdjJIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI3N0cmlwZXMpIi8+PC9zdmc+')] opacity-20"></div>

      {/* Start line */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-white"></div>

      {/* Finish line */}
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat"></div>

      <div className="space-y-4">
        {sortedPlayers.map((player) => {
          const playerProgress = progress[player._id]?.currentWord || 0;
          const progressPercent = (playerProgress / textWords.length) * 100;
          const isCurrentUser = player._id === currentUserId;

          return (
            <div key={player._id} className="relative">
              {/* Player name and status */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${isCurrentUser ? "text-yellow-400" : "text-white"}`}
                  >
                    {player.name} {player.isHost && "👑"}
                  </span>
                  {player.finishTime && (
                    <span className="text-green-400">انتهى! 🏁</span>
                  )}
                </div>
                <span className="text-white">
                  {Math.round(progressPercent)}%
                </span>
              </div>

              {/* Progress track */}
              <div className="relative h-8 overflow-hidden bg-gray-700 rounded-full">
                {/* Progress bar */}
                <div
                  className="h-full transition-all duration-300 ease-out rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    background: isCurrentUser
                      ? "linear-gradient(90deg, #FCD34D, #F59E0B)"
                      : "linear-gradient(90deg, #60A5FA, #3B82F6)",
                  }}
                />

                {/* Car icon */}
                <div
                  className="absolute transition-all duration-300 -translate-y-1/2 top-1/2"
                  style={{ left: `${progressPercent}%` }}
                >
                  <div
                    className={`
                    relative -left-4 text-2xl
                    ${isCurrentUser ? "text-yellow-400" : "text-blue-400"}
                    transform ${progressPercent === 100 ? "scale-x-[-1]" : ""}
                  `}
                  >
                    🏎️
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
