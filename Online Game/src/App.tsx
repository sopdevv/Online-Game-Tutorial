import { useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { RoomEntry } from "./RoomEntry";
import { RoomLobby } from "./RoomLobby";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  if (!roomId || !playerId) {
    return (
      <ConvexProvider client={convex}>
        <RoomEntry
          onEnter={(roomId, playerId) => {
            setRoomId(roomId);
            setPlayerId(playerId);
          }}
        />
      </ConvexProvider>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <RoomLobby
        roomId={roomId}
        playerId={playerId}
        onLeave={() => {
          setRoomId(null);
          setPlayerId(null);
        }}
      />
    </ConvexProvider>
  );
}

export default App;
