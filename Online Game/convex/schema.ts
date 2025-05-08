import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    hostName: v.string(),
    difficulty: v.union(
      v.literal("Easy"),
      v.literal("Medium"),
      v.literal("Hard")
    ),
    createdAt: v.number(),
    started: v.boolean(),
    ended: v.boolean(),
    sentence: v.string(),
  }),
  players: defineTable({
    roomId: v.id("rooms"),
    name: v.string(),
    isHost: v.boolean(),
    progress: v.number(),
    finishTime: v.optional(v.number()),
    left: v.boolean(),
  }).index("by_roomId", ["roomId", "left"]),
});
