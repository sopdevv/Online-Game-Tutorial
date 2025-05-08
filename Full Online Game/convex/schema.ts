import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  rooms: defineTable({
    code: v.string(),
    status: v.union(
      v.literal("lobby"),
      v.literal("countdown"),
      v.literal("in_progress"),
      v.literal("finished")
    ),
    duration: v.number(),
    text: v.string(),
    hostId: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  }),
  players: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),
    name: v.string(),
    isHost: v.boolean(),
    joinedAt: v.number(),
    finishedAt: v.optional(v.number()),
  }),
  progress: defineTable({
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    currentWord: v.number(),
    input: v.string(),
    lastUpdate: v.number(),
  }).index("by_room", ["roomId"]),
});
