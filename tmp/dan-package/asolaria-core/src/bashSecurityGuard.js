/**
 * bashSecurityGuard.js — Bash command security scanner for Asolaria
 *
 * Extracted from Claude Code bashSecurity.ts (2593 lines, 25 attack vectors).
 * Translated to CommonJS. Self-contained, no external dependencies.
 *
 * Integrates with riskEngine.js via numeric 0-10 scoring per vector.
 *
 * Usage:
 *   const { checkCommand, ATTACK_VECTORS } = require('./bashSecurityGuard');
 *   const result = checkCommand('echo hello');
 *   // { safe: true, risks: [], level: 'low', score: 0 }
 */

"use strict";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove content inside single and double quotes, returning the unquoted
 * remainder. Handles backslash escapes outside single quotes.
 */
function extractQuotedContent(command) {
  let withDoubleQuotes = "";
  let fullyUnquoted = "";
  let unquotedKeepQuoteChars = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escaped) {
      escaped = false;
      if (!inSingleQuote) withDoubleQuotes += char;
      if (!inSingleQuote && !inDoubleQuote) fullyUnquoted += char;
      if (!inSingleQuote && !inDoubleQuote) unquotedKeepQuoteChars += char;
      continue;
    }

    if (char === "\\" && !inSingleQuote) {
      escaped = true;
      if (!inSingleQuote) withDoubleQuotes += char;
      if (!inSingleQuote && !inDoubleQuote) fullyUnquoted += char;
      if (!inSingleQuote && !inDoubleQuote) unquotedKeepQuoteChars += char;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      unquotedKeepQuoteChars += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      unquotedKeepQuoteChars += char;
      continue;
    }

    if (!inSingleQuote) withDoubleQuotes += char;
    if (!inSingleQuote && !inDoubleQuote) fullyUnquoted += char;
    if (!inSingleQuote && !inDoubleQuote) unquotedKeepQuoteChars += char;
  }

  return { withDoubleQuotes, fullyUnquoted, unquotedKeepQuoteChars };
}

/**
 * Strip safe redirections (>/dev/null, 2>&1, </dev/null) so they don't
 * trigger false positives on redirection checks.
 */
function stripSafeRedirections(content) {
  return content
    .replace(/\s+2\s*>&\s*1(?=\s|$)/g, "")
    .replace(/[012]?\s*>\s*\/dev\/null(?=\s|$)/g, "")
    .replace(/\s*<\s*\/dev\/null(?=\s|$)/g, "");
}

/**
 * Check if char at position `pos` is escaped by an odd count of preceding
 * backslashes.
 */
function isEscapedAtPosition(content, pos) {
  let count = 0;
  let i = pos - 1;
  while (i >= 0 && content[i] === "\\") {
    count++;
    i--;
  }
  return count % 2 === 1;
}

/**
 * Check if content contains an unescaped occurrence of a single character.
 */
function hasUnescapedChar(content, char) {
  let i = 0;
  while (i < content.length) {
    if (content[i] === "\\" && i + 1 < content.length) {
      i += 2;
      continue;
    }
    if (content[i] === char) return true;
    i++;
  }
  return false;
}

// ---------------------------------------------------------------------------
// ATTACK_VECTORS — 25 named patterns with regex, description, severity, score
// ---------------------------------------------------------------------------

const ATTACK_VECTORS = [
  // 1. Incomplete / fragment commands
  {
    id: "INCOMPLETE_COMMANDS",
    name: "Incomplete Command Fragment",
    description:
      "Command starts with tab, dash, or shell operator — likely an incomplete fragment or continuation that could be concatenated with prior context to form an unintended command.",
    test(cmd, _ctx) {
      const trimmed = cmd.trim();
      if (/^\s*\t/.test(cmd)) return "Starts with tab (incomplete fragment)";
      if (trimmed.startsWith("-")) return "Starts with flags (incomplete fragment)";
      if (/^\s*(&&|\|\||;|>>?|<)/.test(cmd))
        return "Starts with shell operator (continuation line)";
      return null;
    },
    severity: "medium",
    score: 4,
  },

  // 2. Command substitution patterns
  {
    id: "COMMAND_SUBSTITUTION",
    name: "Command Substitution",
    description:
      "Detects $(), ${}, $[], backticks, process substitution <() >(), Zsh =() expansion, glob qualifiers, and always-blocks — all allow injecting executable code inside arguments.",
    test(cmd, ctx) {
      const unquoted = ctx.withDoubleQuotes;
      if (hasUnescapedChar(unquoted, "`"))
        return "Backtick command substitution";
      const patterns = [
        { re: /<\(/, msg: "process substitution <()" },
        { re: />\(/, msg: "process substitution >()" },
        { re: /=\(/, msg: "Zsh process substitution =()" },
        { re: /(?:^|[\s;&|])=[a-zA-Z_]/, msg: "Zsh equals expansion (=cmd)" },
        { re: /\$\(/, msg: "$() command substitution" },
        { re: /\$\{/, msg: "${} parameter substitution" },
        { re: /\$\[/, msg: "$[] legacy arithmetic expansion" },
        { re: /~\[/, msg: "Zsh-style parameter expansion" },
        { re: /\(e:/, msg: "Zsh glob qualifiers" },
        { re: /\(\+/, msg: "Zsh glob qualifier with command execution" },
        { re: /\}\s*always\s*\{/, msg: "Zsh always block (try/always)" },
        { re: /<#/, msg: "PowerShell comment syntax" },
      ];
      for (const { re, msg } of patterns) {
        if (re.test(unquoted)) return msg;
      }
      return null;
    },
    severity: "critical",
    score: 9,
  },

  // 3. Shell metacharacters in arguments
  {
    id: "SHELL_METACHARACTERS",
    name: "Shell Metacharacters in Arguments",
    description:
      "Semicolons, pipes, or ampersands appearing inside quoted arguments or find-style glob patterns — can chain unintended commands.",
    test(_cmd, ctx) {
      const u = ctx.withDoubleQuotes;
      if (/(?:^|\s)["'][^"']*[;&][^"']*["'](?:\s|$)/.test(u))
        return "Metacharacters in quoted arguments";
      if (
        [
          /-name\s+["'][^"']*[;|&][^"']*["']/,
          /-path\s+["'][^"']*[;|&][^"']*["']/,
          /-iname\s+["'][^"']*[;|&][^"']*["']/,
        ].some((p) => p.test(u))
      )
        return "Metacharacters in find glob pattern";
      if (/-regex\s+["'][^"']*[;&][^"']*["']/.test(u))
        return "Metacharacters in find -regex";
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 4. Dangerous variables near redirections/pipes
  {
    id: "DANGEROUS_VARIABLES",
    name: "Variables in Dangerous Contexts",
    description:
      "Shell variables ($VAR) adjacent to redirections or pipes — attacker-controlled variable values can redirect output to arbitrary files.",
    test(_cmd, ctx) {
      const f = ctx.fullyUnquoted;
      if (
        /[<>|]\s*\$[A-Za-z_]/.test(f) ||
        /\$[A-Za-z_][A-Za-z0-9_]*\s*[|<>]/.test(f)
      )
        return "Variable used near redirection or pipe";
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 5. Newline injection
  {
    id: "NEWLINE_INJECTION",
    name: "Newline Command Separation",
    description:
      "Newlines in unquoted content can separate multiple commands — a hidden second command executes after the visible first one.",
    test(_cmd, ctx) {
      const f = ctx.fullyUnquoted;
      if (!/[\n\r]/.test(f)) return null;
      if (/(?<![\s]\\)[\n\r]\s*\S/.test(f))
        return "Newline separates what may be multiple commands";
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 6. Carriage return misparsing
  {
    id: "CARRIAGE_RETURN",
    name: "Carriage Return Tokenization Differential",
    description:
      "\\r outside double quotes causes shell-quote and bash to tokenize differently — shell-quote splits on \\r (JS \\s includes \\r) but bash does not (IFS has no \\r), enabling command name substitution.",
    test(cmd) {
      if (!cmd.includes("\r")) return null;
      let inSQ = false, inDQ = false, escaped = false;
      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\" && !inSQ) { escaped = true; continue; }
        if (c === "'" && !inDQ) { inSQ = !inSQ; continue; }
        if (c === '"' && !inSQ) { inDQ = !inDQ; continue; }
        if (c === "\r" && !inDQ)
          return "Carriage return outside double quotes (parser differential)";
      }
      return null;
    },
    severity: "critical",
    score: 9,
  },

  // 7. IFS injection
  {
    id: "IFS_INJECTION",
    name: "IFS Variable Manipulation",
    description:
      "$IFS or ${...IFS...} can override the Internal Field Separator, changing how bash tokenizes arguments and bypassing regex-based validation.",
    test(cmd) {
      if (/\$IFS|\$\{[^}]*IFS/.test(cmd))
        return "IFS variable usage detected";
      return null;
    },
    severity: "critical",
    score: 9,
  },

  // 8. /proc/environ access
  {
    id: "PROC_ENVIRON",
    name: "/proc Environment Leak",
    description:
      "Reading /proc/*/environ exposes all environment variables of a process, including API keys, tokens, and secrets.",
    test(cmd) {
      if (/\/proc\/.*\/environ/.test(cmd))
        return "/proc/*/environ access (leaks env vars)";
      return null;
    },
    severity: "critical",
    score: 10,
  },

  // 9. Input redirection
  {
    id: "INPUT_REDIRECTION",
    name: "Input Redirection",
    description:
      "Unquoted < can read arbitrary files into a command, exfiltrating sensitive data.",
    test(_cmd, ctx) {
      if (/</.test(ctx.fullyUnquoted))
        return "Input redirection (<) could read sensitive files";
      return null;
    },
    severity: "medium",
    score: 5,
  },

  // 10. Output redirection
  {
    id: "OUTPUT_REDIRECTION",
    name: "Output Redirection",
    description:
      "Unquoted > can overwrite arbitrary files — including shell profiles for RCE on next login.",
    test(_cmd, ctx) {
      if (/>/.test(ctx.fullyUnquoted))
        return "Output redirection (>) could write to arbitrary files";
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 11. Obfuscated flags — ANSI-C quoting
  {
    id: "ANSI_C_QUOTING",
    name: "ANSI-C Quoting Obfuscation",
    description:
      "$'...' (ANSI-C) and $\"...\" (locale) quoting can encode any character via escape sequences, hiding dangerous flags like -exec from pattern matching.",
    test(cmd) {
      if (/\$'[^']*'/.test(cmd)) return "ANSI-C quoting ($'...')";
      if (/\$"[^"]*"/.test(cmd)) return "Locale quoting ($\"...\")";
      if (/\$['"]{2}\s*-/.test(cmd))
        return "Empty special quotes before dash";
      return null;
    },
    severity: "high",
    score: 8,
  },

  // 12. Obfuscated flags — empty quote pairs
  {
    id: "EMPTY_QUOTE_OBFUSCATION",
    name: "Empty Quote Flag Obfuscation",
    description:
      "Empty quote pairs ('', \"\") concatenated with dashes or other quotes can assemble flags like -exec that bypass blocklist checks.",
    test(cmd) {
      if (/(?:^|\s)(?:''|"")+\s*-/.test(cmd))
        return "Empty quotes before dash";
      if (/(?:""|'')+['"]-/.test(cmd))
        return "Empty quote pair adjacent to quoted dash";
      if (/(?:^|\s)['"]{3,}/.test(cmd))
        return "Consecutive quote characters at word start";
      return null;
    },
    severity: "high",
    score: 8,
  },

  // 13. Quoted flag names
  {
    id: "QUOTED_FLAGS",
    name: "Quoted Characters in Flag Names",
    description:
      "Quotes inside or around flag names (\"-exec\", \"-\"exec, \"--\"output) hide the real flag from negative-lookahead blocklists.",
    test(cmd) {
      // Simplified: look for quote-wrapped dashes that form flags
      if (/\s['"`]-\w/.test(cmd)) return "Quote-wrapped flag detected";
      if (/['"`]{2}-/.test(cmd)) return "Double-quote prefix before dash";
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 14. Backslash-escaped whitespace
  {
    id: "BACKSLASH_WHITESPACE",
    name: "Backslash-Escaped Whitespace",
    description:
      "echo\\ test is one token in bash but two in shell-quote — enables path traversal attacks via directory names containing spaces.",
    test(cmd) {
      let inSQ = false, inDQ = false;
      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (c === "\\" && !inSQ) {
          if (!inDQ) {
            const next = cmd[i + 1];
            if (next === " " || next === "\t")
              return "Backslash-escaped space or tab outside quotes";
          }
          i++;
          continue;
        }
        if (c === '"' && !inSQ) { inDQ = !inDQ; continue; }
        if (c === "'" && !inDQ) { inSQ = !inSQ; continue; }
      }
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 15. Backslash-escaped operators
  {
    id: "BACKSLASH_OPERATORS",
    name: "Backslash-Escaped Shell Operators",
    description:
      "\\; \\| \\& \\< \\> — splitCommand normalizes these to bare operators on re-parse, enabling arbitrary file reads that bypass path checks.",
    test(cmd) {
      const OPS = new Set([";", "|", "&", "<", ">"]);
      let inSQ = false, inDQ = false;
      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (c === "\\" && !inSQ) {
          if (!inDQ) {
            const next = cmd[i + 1];
            if (next && OPS.has(next))
              return `Backslash before shell operator \\${next}`;
          }
          i++;
          continue;
        }
        if (c === "'" && !inDQ) { inSQ = !inSQ; continue; }
        if (c === '"' && !inSQ) { inDQ = !inDQ; continue; }
      }
      return null;
    },
    severity: "critical",
    score: 9,
  },

  // 16. Brace expansion
  {
    id: "BRACE_EXPANSION",
    name: "Brace Expansion",
    description:
      "{a,b} or {1..5} in unquoted context — bash expands to multiple words, injecting extra arguments (e.g. --upload-pack=evil) that shell-quote treats as literal.",
    test(_cmd, ctx) {
      const content = ctx.fullyUnquoted;
      // Check for mismatched brace counts (quoted braces stripped)
      let openBraces = 0, closeBraces = 0;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === "{" && !isEscapedAtPosition(content, i)) openBraces++;
        if (content[i] === "}" && !isEscapedAtPosition(content, i)) closeBraces++;
      }
      if (openBraces > 0 && closeBraces > openBraces)
        return "Excess closing braces after quote stripping (obfuscation)";

      // Check for quoted brace inside unquoted brace context
      if (openBraces > 0 && /['"][{}]['"]/.test(_cmd))
        return "Quoted brace inside brace context";

      // Check for comma or .. inside unescaped balanced braces
      for (let i = 0; i < content.length; i++) {
        if (content[i] !== "{" || isEscapedAtPosition(content, i)) continue;
        let depth = 1;
        let close = -1;
        for (let j = i + 1; j < content.length; j++) {
          if (content[j] === "{" && !isEscapedAtPosition(content, j)) depth++;
          if (content[j] === "}" && !isEscapedAtPosition(content, j)) {
            depth--;
            if (depth === 0) { close = j; break; }
          }
        }
        if (close === -1) continue;
        let innerDepth = 0;
        for (let k = i + 1; k < close; k++) {
          if (content[k] === "{" && !isEscapedAtPosition(content, k)) innerDepth++;
          else if (content[k] === "}" && !isEscapedAtPosition(content, k)) innerDepth--;
          else if (innerDepth === 0) {
            if (
              content[k] === "," ||
              (content[k] === "." && k + 1 < close && content[k + 1] === ".")
            )
              return "Brace expansion with comma or sequence (..)";
          }
        }
      }
      return null;
    },
    severity: "high",
    score: 8,
  },

  // 17. Control characters
  {
    id: "CONTROL_CHARACTERS",
    name: "Non-Printable Control Characters",
    description:
      "Null bytes and other non-printable chars (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F) are silently dropped by bash but confuse validators, letting metacharacters slip through.",
    // eslint-disable-next-line no-control-regex
    test(cmd) {
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(cmd))
        return "Non-printable control character detected";
      return null;
    },
    severity: "critical",
    score: 10,
  },

  // 18. Unicode whitespace
  {
    id: "UNICODE_WHITESPACE",
    name: "Unicode Whitespace Characters",
    description:
      "Non-breaking spaces, em spaces, etc. — shell-quote treats them as word separators but bash treats them as literal word content, creating a parser differential.",
    // eslint-disable-next-line no-misleading-character-class
    test(cmd) {
      if (
        /[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/.test(
          cmd
        )
      )
        return "Unicode whitespace character detected";
      return null;
    },
    severity: "high",
    score: 8,
  },

  // 19. Mid-word hash
  {
    id: "MID_WORD_HASH",
    name: "Mid-Word Hash Comment",
    description:
      "# preceded by a non-whitespace character — shell-quote treats it as comment-start but bash treats it as a literal character, creating a parser differential.",
    test(_cmd, ctx) {
      if (/\S(?<!\$\{)#/.test(ctx.unquotedKeepQuoteChars))
        return "Mid-word # (parser differential between shell-quote and bash)";
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 20. Zsh dangerous commands
  {
    id: "ZSH_DANGEROUS_COMMANDS",
    name: "Zsh-Specific Dangerous Commands",
    description:
      "zmodload, emulate, sysopen/read/write, zpty, ztcp, zsocket, zf_* builtins, fc -e — bypass normal permission checks via Zsh kernel modules or eval-equivalents.",
    test(cmd) {
      const ZSH_CMDS = new Set([
        "zmodload", "emulate", "sysopen", "sysread", "syswrite", "sysseek",
        "zpty", "ztcp", "zsocket", "mapfile",
        "zf_rm", "zf_mv", "zf_ln", "zf_chmod", "zf_chown", "zf_mkdir",
        "zf_rmdir", "zf_chgrp",
      ]);
      const PRECOMMAND = new Set(["command", "builtin", "noglob", "nocorrect"]);
      const trimmed = cmd.trim();
      const tokens = trimmed.split(/\s+/);
      let baseCmd = "";
      for (const tok of tokens) {
        if (/^[A-Za-z_]\w*=/.test(tok)) continue;
        if (PRECOMMAND.has(tok)) continue;
        baseCmd = tok;
        break;
      }
      if (ZSH_CMDS.has(baseCmd))
        return `Zsh dangerous command: ${baseCmd}`;
      if (baseCmd === "fc" && /\s-\S*e/.test(trimmed))
        return "fc -e can execute arbitrary commands via editor";
      return null;
    },
    severity: "critical",
    score: 9,
  },

  // 21. jq system() / dangerous flags
  {
    id: "JQ_INJECTION",
    name: "jq Code Execution",
    description:
      "jq's system() function executes arbitrary shell commands. Flags like -f, --rawfile, --slurpfile read arbitrary files into jq variables.",
    test(cmd) {
      const base = (cmd.trim().split(/\s+/)[0] || "").toLowerCase();
      if (base !== "jq") return null;
      if (/\bsystem\s*\(/.test(cmd)) return "jq system() function (RCE)";
      const afterJq = cmd.substring(3).trim();
      if (
        /(?:^|\s)(?:-f\b|--from-file|--rawfile|--slurpfile|-L\b|--library-path)/.test(
          afterJq
        )
      )
        return "jq dangerous file-reading flags";
      return null;
    },
    severity: "critical",
    score: 9,
  },

  // 22. Comment-quote desync
  {
    id: "COMMENT_QUOTE_DESYNC",
    name: "Comment Quote Desynchronization",
    description:
      "Quote characters (' or \") inside a # comment desync downstream quote trackers — attacker crafts # ' \" sequences to make subsequent unquoted content appear quoted, hiding dangerous commands.",
    test(cmd) {
      let inSQ = false, inDQ = false, escaped = false;
      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (escaped) { escaped = false; continue; }
        if (inSQ) { if (c === "'") inSQ = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (inDQ) { if (c === '"') inDQ = false; continue; }
        if (c === "'") { inSQ = true; continue; }
        if (c === '"') { inDQ = true; continue; }
        if (c === "#") {
          const lineEnd = cmd.indexOf("\n", i);
          const comment = cmd.slice(i + 1, lineEnd === -1 ? cmd.length : lineEnd);
          if (/['"]/.test(comment))
            return "Quote character inside # comment (desync risk)";
          if (lineEnd === -1) break;
          i = lineEnd;
        }
      }
      return null;
    },
    severity: "high",
    score: 8,
  },

  // 23. Quoted newline hiding arguments from line-based checks
  {
    id: "QUOTED_NEWLINE",
    name: "Quoted Newline Argument Hiding",
    description:
      "A newline inside quotes followed by a #-prefixed line tricks line-based processors (stripCommentLines) into dropping that line — hiding sensitive paths from permission validation.",
    test(cmd) {
      if (!cmd.includes("\n") || !cmd.includes("#")) return null;
      let inSQ = false, inDQ = false, escaped = false;
      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\" && !inSQ) { escaped = true; continue; }
        if (c === "'" && !inDQ) { inSQ = !inSQ; continue; }
        if (c === '"' && !inSQ) { inDQ = !inDQ; continue; }
        if (c === "\n" && (inSQ || inDQ)) {
          const lineStart = i + 1;
          const nextNL = cmd.indexOf("\n", lineStart);
          const nextLine = cmd.slice(lineStart, nextNL === -1 ? cmd.length : nextNL);
          if (nextLine.trim().startsWith("#"))
            return "Quoted newline followed by #-line (argument hiding)";
        }
      }
      return null;
    },
    severity: "critical",
    score: 9,
  },

  // 24. Git commit message substitution
  {
    id: "GIT_COMMIT_SUBSTITUTION",
    name: "Git Commit Message Injection",
    description:
      "Command substitution ($(), ``, ${}) inside a double-quoted git commit -m message executes at runtime. Backslashes in commit commands can also desync quote boundary detection.",
    test(cmd) {
      const base = (cmd.trim().split(/\s+/)[0] || "").toLowerCase();
      if (base !== "git") return null;
      if (!/^git\s+commit\s+/.test(cmd)) return null;
      if (cmd.includes("\\"))
        return "Backslash in git commit (quote boundary risk)";
      const m = cmd.match(
        /^git[ \t]+commit[ \t]+[^;&|`$<>()\n\r]*?-m[ \t]+(["'])([\s\S]*?)\1(.*)$/
      );
      if (!m) return null;
      const [, quote, body, remainder] = m;
      if (quote === '"' && body && /\$\(|`|\$\{/.test(body))
        return "Command substitution inside commit message";
      if (remainder && /[;|&()`]|\$\(|\$\{/.test(remainder))
        return "Shell metacharacters after commit message";
      return null;
    },
    severity: "high",
    score: 7,
  },

  // 25. Malformed token injection (bonus — defense-in-depth)
  {
    id: "MALFORMED_TOKEN_INJECTION",
    name: "Malformed Token with Command Separators",
    description:
      "Ambiguous syntax (unbalanced delimiters like {, [, () combined with ;, &&, ||) can cause shell-quote to produce tokens that bash interprets differently — exploitable via eval re-parsing.",
    test(cmd) {
      // Simplified check: unbalanced braces/brackets + command separators
      if (!/[;]|&&|\|\|/.test(cmd)) return null;
      let braces = 0, brackets = 0, parens = 0;
      let inSQ = false, inDQ = false, escaped = false;
      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\" && !inSQ) { escaped = true; continue; }
        if (c === "'" && !inDQ) { inSQ = !inSQ; continue; }
        if (c === '"' && !inSQ) { inDQ = !inDQ; continue; }
        if (inSQ || inDQ) continue;
        if (c === "{") braces++;
        if (c === "}") braces--;
        if (c === "[") brackets++;
        if (c === "]") brackets--;
        if (c === "(") parens++;
        if (c === ")") parens--;
      }
      if (braces !== 0 || brackets !== 0 || parens !== 0)
        return "Unbalanced delimiters with command separators (injection risk)";
      return null;
    },
    severity: "high",
    score: 7,
  },
];

// ---------------------------------------------------------------------------
// Score / level helpers (matches riskEngine.js pattern)
// ---------------------------------------------------------------------------

function scoreToLevel(score) {
  if (score >= 9) return "critical";
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// checkCommand — main entry point
// ---------------------------------------------------------------------------

/**
 * Scan a bash command string for known attack vectors.
 *
 * @param {string} command  Raw command string (may contain quotes, pipes, etc.)
 * @returns {{ safe: boolean, risks: Array<{id:string, name:string, detail:string, score:number, severity:string}>, level: string, score: number }}
 */
function checkCommand(command) {
  if (typeof command !== "string" || !command.trim()) {
    return { safe: true, risks: [], level: "low", score: 0 };
  }

  // Build context once
  const { withDoubleQuotes, fullyUnquoted, unquotedKeepQuoteChars } =
    extractQuotedContent(command);
  const ctx = {
    withDoubleQuotes,
    fullyUnquoted: stripSafeRedirections(fullyUnquoted),
    unquotedKeepQuoteChars,
  };

  const risks = [];
  let maxScore = 0;

  for (const vector of ATTACK_VECTORS) {
    const detail = vector.test(command, ctx);
    if (detail) {
      risks.push({
        id: vector.id,
        name: vector.name,
        detail,
        score: vector.score,
        severity: vector.severity,
      });
      if (vector.score > maxScore) maxScore = vector.score;
    }
  }

  return {
    safe: risks.length === 0,
    risks,
    level: scoreToLevel(maxScore),
    score: maxScore,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  checkCommand,
  ATTACK_VECTORS,
  // Expose helpers for testing / composition with riskEngine
  scoreToLevel,
  extractQuotedContent,
  stripSafeRedirections,
};
