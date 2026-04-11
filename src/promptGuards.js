/**
 * promptGuards.js — Anti-tool-call sandwich pattern for Asolaria agent prompts.
 *
 * Prevents agents from making tool calls when they should produce text-only
 * output. Sonnet 4.6+ has a 2.79% tool-call failure rate without the sandwich
 * (vs 0.01% on 4.5). Putting the preamble FIRST and the trailer LAST ensures
 * the model sees the constraint at both ends of the prompt window.
 *
 * Adapted from Claude Code compact/prompt.ts — NO_TOOLS_PREAMBLE,
 * NO_TOOLS_TRAILER, DETAILED_ANALYSIS_INSTRUCTION, and the 9-section summary
 * template.
 *
 * CommonJS, no dependencies.
 */

'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TOOL_NAMES = [
  'Read', 'Bash', 'Grep', 'Glob', 'Edit', 'Write',
  'WebFetch', 'WebSearch', 'NotebookEdit',
];

// ---------------------------------------------------------------------------
// 1. wrapTextOnly(prompt, toolNames)
// ---------------------------------------------------------------------------

/**
 * Wraps a prompt with a preamble and trailer that instruct the model to
 * respond with plain text only — no tool calls.
 *
 * @param {string} prompt        The inner prompt text.
 * @param {string[]} [toolNames] Tools to name explicitly in the ban list.
 *                               Defaults to the standard Asolaria surface set.
 * @returns {string} The sandwiched prompt.
 */
function wrapTextOnly(prompt, toolNames) {
  const tools = toolNames && toolNames.length > 0 ? toolNames : DEFAULT_TOOL_NAMES;
  const toolList = tools.join(', ');

  const preamble =
    'CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.\n' +
    '\n' +
    `- Do NOT use ${toolList}, or ANY other tool.\n` +
    '- You already have all the context you need in the conversation above.\n' +
    '- Tool calls will be REJECTED and will waste your only turn — you will fail the task.\n' +
    '- Your entire response must be plain text.\n' +
    '\n';

  const trailer =
    '\n\nREMINDER: Do NOT call any tools. Respond with plain text only. ' +
    'Tool calls will be rejected and you will fail the task.';

  return preamble + prompt + trailer;
}

// ---------------------------------------------------------------------------
// 2. wrapAnalysisScratchpad(prompt)
// ---------------------------------------------------------------------------

/**
 * Adds <analysis> scratchpad instructions to a prompt and returns a helper
 * that strips the scratchpad from the model's output.
 *
 * The analysis block is a drafting area that improves summary quality but has
 * no informational value once the final output is written.
 *
 * @param {string} prompt The inner prompt text.
 * @returns {{ prompt: string, stripAnalysis: (output: string) => string }}
 */
/**
 * Strips the <analysis>...</analysis> block from model output and cleans up
 * extra whitespace.
 *
 * @param {string} output Raw model output.
 * @returns {string} Output with analysis block removed.
 */
function stripAnalysis(output) {
  let cleaned = output.replace(/<analysis>[\s\S]*?<\/analysis>/g, '');
  cleaned = cleaned.replace(/\n\n+/g, '\n\n');
  return cleaned.trim();
}

/**
 * Returns the analysis scratchpad instructions for a given analysis scope.
 *
 * @param {string} [analysisScope] Scope description for step 1.
 *   Defaults to 'each message and section of the conversation'.
 * @returns {string}
 */
function _buildAnalysisInstructions(analysisScope) {
  const scope = analysisScope || 'each message and section of the conversation';
  return (
    'Before providing your final output, wrap your analysis in <analysis> tags to organize your thoughts and ensure you have covered all necessary points. In your analysis process:\n' +
    '\n' +
    `1. Chronologically analyze ${scope}. For each section thoroughly identify:\n` +
    '   - The user\'s explicit requests and intents\n' +
    '   - Your approach to addressing the user\'s requests\n' +
    '   - Key decisions, technical concepts and code patterns\n' +
    '   - Specific details like file names, code snippets, function signatures, file edits\n' +
    '   - Errors encountered and how they were fixed\n' +
    '   - IX/LX entries created, updated, or referenced\n' +
    '   - Pay special attention to specific user feedback, especially corrections\n' +
    '2. Double-check for technical accuracy and completeness.\n'
  );
}

function wrapAnalysisScratchpad(prompt) {
  const wrappedPrompt = _buildAnalysisInstructions() + '\n' + prompt;
  return { prompt: wrappedPrompt, stripAnalysis };
}

// ---------------------------------------------------------------------------
// 3. buildCompactSummaryPrompt(turns, options)
// ---------------------------------------------------------------------------

/**
 * Builds the 9-section compact summary prompt adapted for Asolaria's IX/LX
 * index language.
 *
 * The nine sections mirror Claude Code's template:
 *   1. Primary Request and Intent
 *   2. Key Concepts (technical + IX/LX entries)
 *   3. Files and Code Sections
 *   4. Errors and Fixes
 *   5. Problem Solving
 *   6. All User Messages
 *   7. Pending Tasks
 *   8. Current Work
 *   9. Next Step
 *
 * @param {Array<{role: string, content: string}>} turns
 *   Conversation turns to summarize. Each turn has `role` and `content`.
 * @param {object} [options]
 * @param {string} [options.customInstructions]  Extra instructions appended.
 * @param {boolean} [options.partial=false]      If true, summarize only recent
 *                                               messages (after retained context).
 * @param {boolean} [options.textOnly=true]      Wrap with anti-tool sandwich.
 * @param {string[]} [options.toolNames]         Tool names for the sandwich.
 * @returns {string} The full prompt ready to send to the model.
 */
function buildCompactSummaryPrompt(turns, options) {
  const opts = options || {};
  const partial = opts.partial || false;
  const textOnly = opts.textOnly !== false; // default true

  const scope = partial
    ? 'the RECENT portion of the conversation — the messages that follow earlier retained context. The earlier messages are being kept intact and do NOT need to be summarized. Focus your summary on what was discussed, learned, and accomplished in the recent messages only.'
    : 'the conversation so far, paying close attention to the user\'s explicit requests and your previous actions.';

  const analysisScope = partial
    ? 'the recent messages chronologically'
    : 'each message and section of the conversation';

  const body =
    `Your task is to create a detailed summary of ${scope}\n` +
    'This summary should be thorough in capturing technical details, code patterns, IX/LX index entries, and architectural decisions that would be essential for continuing work without losing context.\n' +
    '\n' +
    _buildAnalysisInstructions(analysisScope) +
    '\n' +
    'Your summary should include the following sections:\n' +
    '\n' +
    '1. Primary Request and Intent: Capture all of the user\'s explicit requests and intents in detail.\n' +
    '2. Key Concepts: List all important technical concepts, technologies, frameworks, and IX/LX index entries discussed.\n' +
    '3. Files and Code Sections: Enumerate specific files and code sections examined, modified, or created. Include full code snippets where applicable and a summary of why each file read or edit is important.\n' +
    '4. Errors and Fixes: List all errors encountered and how they were fixed. Include user feedback on errors.\n' +
    '5. Problem Solving: Document problems solved and any ongoing troubleshooting efforts.\n' +
    '6. All User Messages: List ALL user messages that are not tool results. These are critical for understanding feedback and changing intent.\n' +
    '7. Pending Tasks: Outline any pending tasks explicitly requested.\n' +
    '8. Current Work: Describe in detail precisely what was being worked on immediately before this summary request, including file names, code snippets, and IX/LX entries where applicable.\n' +
    '9. Next Step: List the next step related to the most recent work. IMPORTANT: ensure this step is DIRECTLY in line with the user\'s most recent explicit requests. If the last task was concluded, only list next steps if they are explicitly requested. Include direct quotes from the most recent conversation showing exactly what task was in progress.\n' +
    '\n' +
    '<example>\n' +
    '<analysis>\n' +
    '[Your thought process, ensuring all points are covered thoroughly and accurately]\n' +
    '</analysis>\n' +
    '\n' +
    '<summary>\n' +
    '1. Primary Request and Intent:\n' +
    '   [Detailed description]\n' +
    '\n' +
    '2. Key Concepts:\n' +
    '   - [Concept 1]\n' +
    '   - [IX/LX entry]\n' +
    '\n' +
    '3. Files and Code Sections:\n' +
    '   - [File Name 1]\n' +
    '      - [Why this file matters]\n' +
    '      - [Code snippet]\n' +
    '\n' +
    '4. Errors and Fixes:\n' +
    '   - [Error description]:\n' +
    '      - [How it was fixed]\n' +
    '\n' +
    '5. Problem Solving:\n' +
    '   [Description]\n' +
    '\n' +
    '6. All User Messages:\n' +
    '   - [User message]\n' +
    '\n' +
    '7. Pending Tasks:\n' +
    '   - [Task 1]\n' +
    '\n' +
    '8. Current Work:\n' +
    '   [Precise description of current work]\n' +
    '\n' +
    '9. Next Step:\n' +
    '   [Next step with direct quotes]\n' +
    '</summary>\n' +
    '</example>\n' +
    '\n' +
    'Please provide your summary following this structure.\n';

  let prompt = body;

  // Append conversation turns as context
  if (turns && turns.length > 0) {
    prompt += '\n--- Conversation to summarize ---\n\n';
    for (const turn of turns) {
      const role = (turn.role || 'unknown').toUpperCase();
      prompt += `[${role}]: ${turn.content}\n\n`;
    }
    prompt += '--- End of conversation ---\n';
  }

  // Custom instructions
  if (opts.customInstructions && opts.customInstructions.trim() !== '') {
    prompt += `\nAdditional Instructions:\n${opts.customInstructions}\n`;
  }

  // Anti-tool sandwich
  if (textOnly) {
    prompt = wrapTextOnly(prompt, opts.toolNames);
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  wrapTextOnly,
  wrapAnalysisScratchpad,
  stripAnalysis,
  buildCompactSummaryPrompt,
  DEFAULT_TOOL_NAMES,
};
