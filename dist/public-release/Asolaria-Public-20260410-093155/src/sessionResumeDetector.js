/**
 * sessionResumeDetector.js — Interruption detection and session recovery
 *
 * Three states:
 *   clean            — session ended normally (assistant spoke last, or ended explicitly)
 *   interrupted_prompt — user typed a message but never got a response
 *   interrupted_turn   — agent was mid-execution (tool result pending, attachment dangling)
 *
 * Modeled after claude-code's conversationRecovery.ts patterns, adapted for
 * Asolaria's agentSessionStore shape (CommonJS, zero dependencies).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isWhitespaceOnly(text) {
  return typeof text === "string" && text.trim().length === 0;
}

function isThinkingOnly(msg) {
  if (msg.role !== "assistant") return false;
  const content = msg.content;
  if (!Array.isArray(content)) return false;
  return content.every(
    (block) => block.type === "thinking" || block.type === "redacted_thinking"
  );
}

function isIncompleteAssistant(msg) {
  if (msg.role !== "assistant") return false;
  // No content at all — stream died before first block
  if (!msg.content && !msg.text) return true;
  // Whitespace-only text
  if (typeof msg.text === "string" && isWhitespaceOnly(msg.text) && !msg.content) return true;
  if (typeof msg.content === "string" && isWhitespaceOnly(msg.content)) return true;
  // Array content that is only thinking blocks
  if (isThinkingOnly(msg)) return true;
  return false;
}

function isToolResult(msg) {
  if (msg.role !== "user") return false;
  const content = msg.content;
  if (!Array.isArray(content)) return false;
  return content.some((block) => block.type === "tool_result");
}

function isSystemOrProgress(msg) {
  return msg.role === "system" || msg.type === "system" || msg.type === "progress";
}

function isMeta(msg) {
  return !!msg.isMeta || !!msg.isCompactSummary;
}

/** Walk backwards past system/progress noise to find last turn-relevant message. */
function findLastRelevantIndex(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (isSystemOrProgress(m)) continue;
    // Skip API-error sentinel assistants
    if (m.role === "assistant" && m.isApiErrorMessage) continue;
    return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Core: detectInterruptionState
// ---------------------------------------------------------------------------

/**
 * Examines a session's message history and returns the interruption state.
 *
 * @param {object} session — An Asolaria session object (from agentSessionStore).
 *   Must contain at least: { prompts?, messages?, status?, endReason? }
 *   `messages` is the conversation array (role-based message objects).
 *   Falls back to `prompts` (prompt-text history) if `messages` is absent.
 *
 * @returns {{ state: string, lastMessage: object|null, recoverySuggestion: string }}
 */
function detectInterruptionState(session) {
  if (!session) {
    return { state: "clean", lastMessage: null, recoverySuggestion: "" };
  }

  // Explicitly ended sessions are always clean
  if (session.status === "ended") {
    return { state: "clean", lastMessage: null, recoverySuggestion: "" };
  }

  const messages = session.messages;

  // If there is no message array, fall back to prompt history heuristic
  if (!Array.isArray(messages) || messages.length === 0) {
    // If session has prompts but status is still "active", the last prompt
    // may have been interrupted (agent never responded).
    if (Array.isArray(session.prompts) && session.prompts.length > 0) {
      const lastPrompt = session.prompts[session.prompts.length - 1];
      return {
        state: "interrupted_prompt",
        lastMessage: lastPrompt,
        recoverySuggestion: `Your last input was: "${(lastPrompt.text || "").slice(0, 120)}"`,
      };
    }
    return { state: "clean", lastMessage: null, recoverySuggestion: "" };
  }

  const lastIdx = findLastRelevantIndex(messages);
  if (lastIdx === -1) {
    return { state: "clean", lastMessage: null, recoverySuggestion: "" };
  }

  const last = messages[lastIdx];

  // --- Assistant last → completed turn
  if (last.role === "assistant") {
    return { state: "clean", lastMessage: last, recoverySuggestion: "" };
  }

  // --- User last
  if (last.role === "user") {
    // Meta / compact summary messages are bookkeeping, not real prompts
    if (isMeta(last)) {
      return { state: "clean", lastMessage: last, recoverySuggestion: "" };
    }

    // Tool result without a following assistant → agent was mid-execution
    if (isToolResult(last)) {
      return {
        state: "interrupted_turn",
        lastMessage: last,
        recoverySuggestion: "Continue from where you left off.",
      };
    }

    // Plain text user message → user typed, agent never started
    const text =
      typeof last.content === "string"
        ? last.content
        : typeof last.text === "string"
          ? last.text
          : Array.isArray(last.content)
            ? last.content
                .filter((b) => b.type === "text")
                .map((b) => b.text)
                .join(" ")
            : "";

    return {
      state: "interrupted_prompt",
      lastMessage: last,
      recoverySuggestion: text
        ? `Your last input was: "${text.slice(0, 120)}"`
        : "You had a pending prompt with no response.",
    };
  }

  // --- Attachment last → user provided context, agent never responded
  if (last.type === "attachment" || last.role === "attachment") {
    return {
      state: "interrupted_turn",
      lastMessage: last,
      recoverySuggestion: "Continue from where you left off.",
    };
  }

  return { state: "clean", lastMessage: last, recoverySuggestion: "" };
}

// ---------------------------------------------------------------------------
// buildRecoveryMessage
// ---------------------------------------------------------------------------

/**
 * Generates a synthetic continuation message for the detected state.
 *
 * @param {{ state: string, lastMessage: object|null, recoverySuggestion: string }} detection
 * @returns {{ role: string, content: string, isMeta: boolean }|null}
 *   null when no recovery is needed (clean exit).
 */
function buildRecoveryMessage(detection) {
  if (!detection || detection.state === "clean") return null;

  if (detection.state === "interrupted_turn") {
    return {
      role: "user",
      content: "Continue from where you left off.",
      isMeta: true,
    };
  }

  if (detection.state === "interrupted_prompt") {
    const hint = detection.recoverySuggestion || "Resume the conversation.";
    return {
      role: "user",
      content: hint,
      isMeta: true,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// cleanOrphanedMessages
// ---------------------------------------------------------------------------

/**
 * Strips messages that would cause API errors or pollute context on resume:
 *   - whitespace-only assistant messages (stream died mid-output)
 *   - thinking-only assistant messages (orphaned thinking blocks)
 *   - incomplete assistant messages (no content at all)
 *
 * Returns a new array; does not mutate the input.
 *
 * @param {object[]} messages
 * @returns {object[]}
 */
function cleanOrphanedMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.filter((msg) => !isIncompleteAssistant(msg));
}

// ---------------------------------------------------------------------------
// appendNoResponseSentinel
// ---------------------------------------------------------------------------

const NO_RESPONSE_SENTINEL = "[No response was generated]";

/**
 * If the last turn-relevant message is from the user, appends a synthetic
 * assistant sentinel so the conversation is API-valid (alternating roles).
 *
 * Inserts right after the last user message, before any trailing
 * system/progress noise, matching claude-code's splice strategy.
 *
 * Returns a new array; does not mutate the input.
 *
 * @param {object[]} messages
 * @returns {object[]}
 */
function appendNoResponseSentinel(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;

  const out = messages.slice();
  const lastIdx = findLastRelevantIndex(out);

  if (lastIdx === -1) return out;

  const last = out[lastIdx];
  if (last.role === "user") {
    out.splice(lastIdx + 1, 0, {
      role: "assistant",
      content: NO_RESPONSE_SENTINEL,
      isSentinel: true,
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  detectInterruptionState,
  buildRecoveryMessage,
  cleanOrphanedMessages,
  appendNoResponseSentinel,
  NO_RESPONSE_SENTINEL,
};
