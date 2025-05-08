import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Use the Arabic texts from the previous RoomForm.tsx
const texts: Record<number, string[]> = {
  60: [
    "سافر خالد إلى السوق واشترى بعض الفواكه الطازجة.",
    "في صباح مشمس، ذهب الأطفال إلى الحديقة للعب.",
    "القراءة توسع مدارك الإنسان وتزيد من معرفته.",
    "القط يجلس بجانب النافذة يراقب العصافير.",
    "النجاح يحتاج إلى صبر واجتهاد ومثابرة.",
  ],
  180: [
    "في أحد الأيام قرر سامي أن يبدأ بتعلم البرمجة، فجلس أمام الحاسوب وبدأ بقراءة الدروس. بعد عدة ساعات من المحاولة، تمكن من كتابة أول برنامج بسيط له، وشعر بسعادة كبيرة عندما رأى النتيجة تظهر على الشاشة.",
    "الطبيعة الخلابة في شمال المملكة تجذب الكثير من السياح سنوياً للاستمتاع بجمالها. الجبال الشاهقة والوديان الخضراء والأنهار الجارية تشكل لوحة فنية رائعة تأسر القلوب وتبعث في النفس الراحة والطمأنينة.",
    "كتابة النصوص بسرعة تتطلب تدريباً مستمراً على لوحة المفاتيح. يجب على المتسابق أن يركز جيداً ويتجنب الأخطاء الإملائية ليحقق أفضل نتيجة ممكنة في أقل وقت.",
    "في المساء اجتمع الأصدقاء حول الطاولة وتبادلوا أطراف الحديث والضحك. تحدثوا عن مغامراتهم في المدرسة والرحلات التي قاموا بها في العطلات الصيفية.",
    "العمل الجماعي يحقق نتائج أفضل من العمل الفردي في معظم الأحيان. عندما يتعاون الجميع ويشارك كل فرد بأفكاره ومهاراته، يصبح الإنجاز أسهل وأسرع وأكثر إبداعاً.",
  ],
  300: [
    "في صباح يوم الجمعة، استيقظت العائلة مبكراً وذهبت في رحلة إلى البحر. كان الجو لطيفاً والسماء صافية، فاستمتع الجميع بالسباحة وجمع الأصداف على الشاطئ. بعد ذلك تناولوا وجبة الإفطار معاً تحت ظل شجرة كبيرة، وتبادلوا الأحاديث والضحكات. في طريق العودة توقفوا عند بائع الفواكه واشتروا بعض التمر والرمان الطازج.",
    "أحمد يحب قراءة الكتب التاريخية لأنها تعطيه فكرة عن حضارات الشعوب القديمة وتطورها عبر الزمن. في إحدى الليالي قرأ عن حضارة بابل وكيف كانت مركزاً للعلم والفن. استلهم من قصص العلماء القدماء وقرر أن يكتب مقالاً عن أهمية العلم في بناء المجتمعات.",
    "في المدرسة، شارك الطلاب في مسابقة للكتابة الإبداعية، حيث كتب كل طالب قصة قصيرة عن مغامرة خيالية. اختار سالم أن يكتب عن رحلة إلى الفضاء، بينما فضلت نورة أن تكتب عن مغامرة في أعماق البحر. في نهاية اليوم، قرأ الجميع قصصهم أمام الفصل وصفق لهم المعلم بحرارة.",
    "الرياضة مهمة لصحة الجسم والعقل، لذلك يحرص الكثيرون على ممارسة التمارين يومياً. الجري في الصباح يمنح الإنسان نشاطاً وحيوية طوال اليوم، كما أن الألعاب الجماعية تعزز روح التعاون والمنافسة الشريفة بين الأصدقاء.",
    "في نهاية الأسبوع، يجتمع أفراد العائلة حول مائدة الطعام ويتبادلون الأحاديث والضحكات. يتحدثون عن أحداث الأسبوع، ويخططون للقيام بنزهة في الحديقة أو زيارة الأقارب. هذه اللحظات العائلية تظل محفورة في الذاكرة وتمنح الجميع شعوراً بالدفء والانتماء.",
  ],
};

function pickRandomText(duration: number): string {
  const arr = texts[duration];
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

export const createRoom = mutation({
  args: {
    sessionId: v.string(),
    name: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    // Generate a random 4-letter code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Pick a random Arabic text for the selected duration
    const text = pickRandomText(args.duration);

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      code,
      status: "lobby",
      duration: args.duration,
      text,
      hostId: args.sessionId,
    });

    // Create the player (as host)
    const playerId = await ctx.db.insert("players", {
      roomId,
      sessionId: args.sessionId,
      name: args.name,
      isHost: true,
      joinedAt: Date.now(),
    });

    return { code, roomId, playerId };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    sessionId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the room
    const room = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("code"), args.code.toUpperCase()))
      .unique();

    if (!room) {
      throw new Error("Room not found");
    }

    // Check if player already exists
    const existingPlayer = await ctx.db
      .query("players")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), room._id),
          q.eq(q.field("sessionId"), args.sessionId)
        )
      )
      .unique();

    if (existingPlayer) {
      return { roomId: room._id, playerId: existingPlayer._id };
    }

    // Create new player
    const playerId = await ctx.db.insert("players", {
      roomId: room._id,
      sessionId: args.sessionId,
      name: args.name,
      isHost: false,
      joinedAt: Date.now(),
    });

    // If game is in progress, initialize their progress
    if (room.status === "in_progress") {
      await ctx.db.insert("progress", {
        roomId: room._id,
        playerId,
        currentWord: 0,
        input: "",
        lastUpdate: Date.now(),
      });
    }

    return { roomId: room._id, playerId };
  },
});

export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify host
    const player = await ctx.db
      .query("players")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("sessionId"), args.sessionId)
        )
      )
      .unique();

    if (!player?.isHost) {
      throw new Error("Only the host can start the game");
    }

    if (room.status !== "lobby") {
      throw new Error("Game already started");
    }

    // Set countdown state
    await ctx.db.patch(args.roomId, {
      status: "countdown",
      startTime: Date.now() + 3000, // 3 second countdown
    });

    // Initialize progress for all players
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    for (const player of players) {
      await ctx.db.insert("progress", {
        roomId: args.roomId,
        playerId: player._id,
        currentWord: 0,
        input: "",
        lastUpdate: Date.now(),
      });
    }
  },
});

export const setInProgress = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "countdown") {
      throw new Error("Not in countdown");
    }

    await ctx.db.patch(args.roomId, {
      status: "in_progress",
      endTime: Date.now() + room.duration * 1000,
    });
  },
});

export const finishGame = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Only update if the game is in progress
    if (room.status === "in_progress") {
      await ctx.db.patch(args.roomId, {
        status: "finished",
      });
    }
  },
});

export const restartGame = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify host
    const player = await ctx.db
      .query("players")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("sessionId"), args.sessionId)
        )
      )
      .unique();

    if (!player?.isHost) {
      throw new Error("Only the host can restart the game");
    }

    if (room.status !== "finished") {
      throw new Error("Game not finished");
    }

    // Delete all progress
    const progress = await ctx.db
      .query("progress")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    // Reset room to lobby
    await ctx.db.patch(args.roomId, {
      status: "lobby",
      startTime: undefined,
      endTime: undefined,
    });

    // Reset player finish times
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    for (const p of players) {
      await ctx.db.patch(p._id, {
        finishedAt: undefined,
      });
    }
  },
});

export const getRoom = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("code"), args.code.toUpperCase()))
      .unique();
  },
});

export const listPlayers = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();
  },
});
