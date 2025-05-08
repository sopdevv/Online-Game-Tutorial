import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const updateProgress = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    currentWord: v.number(),
    input: v.string(),
  },
  handler: async (ctx, args) => {
    const { roomId, playerId, currentWord, input } = args;

    const existingProgress = await ctx.db
      .query("progress")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .filter((q) => q.eq(q.field("playerId"), playerId))
      .unique();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        currentWord,
        input,
        lastUpdate: Date.now(),
      });
    } else {
      await ctx.db.insert("progress", {
        roomId,
        playerId,
        currentWord,
        input,
        lastUpdate: Date.now(),
      });
    }
  },
});

export const getProgress = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const { roomId } = args;
    return await ctx.db
      .query("progress")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
  },
});

export const finishPlayer = mutation({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, {
      finishedAt: Date.now(),
    });
  },
});
