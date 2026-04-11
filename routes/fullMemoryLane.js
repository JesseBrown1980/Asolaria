const express = require("express");
const { asBool, asInt, respondError, inferHttpStatusForError } = require("../lib/helpers");
const {
  getFullMemoryLaneStatus,
  listFullMemoryConversations,
  getFullMemoryConversation,
  searchFullMemoryLane,
  backfillFullMemoryFromPublicMemory
} = require("../src/fullMemoryLaneStore");

function createFullMemoryLaneRouter(ctx = {}) {
  const router = express.Router();
  const app = {
    get: (p, ...h) => router.get(p, ...h),
    post: (p, ...h) => router.post(p, ...h)
  };
  const { getMemoryState } = ctx;

  app.get("/status", (_req, res) => {
    try {
      return res.json(getFullMemoryLaneStatus());
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  app.get("/conversations", (req, res) => {
    try {
      const limit = asInt(req.query?.limit, 40, 1, 200);
      const includeTitles = asBool(req.query?.includeTitles, true);
      const conversations = listFullMemoryConversations(limit, { includeTitles });
      return res.json({
        ok: true,
        count: conversations.length,
        conversations
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  app.get("/conversations/:chatId", (req, res) => {
    try {
      const limit = asInt(req.query?.limit, 160, 1, 2000);
      const conversation = getFullMemoryConversation(req.params?.chatId || "", limit);
      return res.json({
        ok: true,
        ...conversation
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  app.get("/search", (req, res) => {
    try {
      const query = String(req.query?.q || req.query?.query || "").trim();
      if (!query) {
        return respondError(res, "q is required.", 400);
      }
      const limit = asInt(req.query?.limit, 40, 1, 400);
      const chatId = String(req.query?.chatId || "").trim();
      const matches = searchFullMemoryLane(query, limit, { chatId });
      return res.json({
        ok: true,
        query,
        count: matches.length,
        matches
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  app.post("/backfill/public-memory", (req, res) => {
    try {
      if (typeof getMemoryState !== "function") {
        return respondError(res, "Public memory state accessor is unavailable.", 500);
      }
      const memory = getMemoryState(400, { clean: false });
      const result = backfillFullMemoryFromPublicMemory(memory, {
        onlyIfEmpty: asBool(req.body?.onlyIfEmpty, true)
      });
      return res.json({
        ok: true,
        result,
        sourceMemory: {
          updatedAt: String(memory?.updatedAt || ""),
          totalTurns: Number(memory?.totalTurns || 0)
        }
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  return router;
}

module.exports = createFullMemoryLaneRouter;
