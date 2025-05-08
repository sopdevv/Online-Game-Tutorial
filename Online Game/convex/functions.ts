import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SENTENCES = {
  Easy: "العلم نور يضيء دروب الساعين الى المعرفة",
  Medium: "تتهادى النسائم بين اغصان الاشجار تنشد الحان الصباح الباكر",
  Hard: "من طلب العلا سهر الليالي وسلك دروب التعب وصبر على مشقة الطريق",
};

export const createRoom = mutation({
  args: {
    hostName: v.string(),
    difficulty: v.union(
      v.literal("Easy"),
      v.literal("Medium"),
      v.literal("Hard")
    ),
  },
  handler: async (ctx, { hostName, difficulty }) => {
    const roomId = await ctx.db.insert("rooms", {
      hostName,
      difficulty,
      createdAt: Date.now(),
      started: false,
      ended: false,
      sentence: SENTENCES[difficulty],
    });
    const playerId = await ctx.db.insert("players", {
      roomId,
      name: hostName,
      isHost: true,
      progress: 0,
      left: false,
    });
    return { roomId, playerId };
  },
});

export const joinRoom = mutation({
  args: { roomId: v.id("rooms"), name: v.string() },
  handler: async (ctx, { roomId, name }) => {
    const playerId = await ctx.db.insert("players", {
      roomId,
      name,
      isHost: false,
      progress: 0,
      left: false,
    });
    return { playerId };
  },
});

export const leaveRoom = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await ctx.db.patch(playerId, { left: true });
  },
});

export const listPlayers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    return await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId).eq("left", false))
      .collect();
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    return await ctx.db.get(roomId);
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    await ctx.db.patch(roomId, { started: true, ended: false });
    // Reset all players' progress
    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();
    for (const player of players) {
      await ctx.db.patch(player._id, { progress: 0, finishTime: undefined });
    }
  },
});

export const submitWord = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) return;

    const room = await ctx.db.get(player.roomId);
    if (!room) return;

    const totalWords = room.sentence.split(" ").length;
    const newProgress = (player.progress || 0) + 1;
    const patch: Record<string, any> = { progress: newProgress };

    if (newProgress === totalWords && player.finishTime === undefined) {
      patch.finishTime = Date.now();
    }

    await ctx.db.patch(playerId, patch);
  },
});

export const finishGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.ended) return;

    await ctx.db.patch(roomId, { ended: true, started: false });

    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId).eq("left", false))
      .collect();

    const totalWords = room.sentence.split(" ").length;
    const now = Date.now();

    for (const player of players) {
      if (player.progress === totalWords && player.finishTime === undefined) {
        await ctx.db.patch(player._id, { finishTime: now });
      }
    }
  },
});

export const restartGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    await ctx.db.patch(roomId, { started: false, ended: false });
    // Reset all players' progress
    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();
    for (const player of players) {
      await ctx.db.patch(player._id, { progress: 0, finishTime: undefined });
    }
  },
});

export const getProgress = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId).eq("left", false))
      .collect();
    return players.map((p) => ({
      name: p.name,
      progress: p.progress,
      isHost: p.isHost,
      finishTime: p.finishTime,
      _id: p._id,
    }));
  },
  
});
