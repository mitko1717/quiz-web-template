const PROMPT_TOKEN_PREFIX = '@i18n:';

export interface ParsedPromptToken {
  key: string;
  params: Record<string, string | number>;
}

// Mirrors engine's core/prompt-token.ts encoding. A topic's forward/reverse prompt can be
// either a plain string (legacy, e.g. Capitals: "France") or this structured token — a fully
// self-contained i18n key + interpolation params, so the generic "What is X of {value}?"
// wrapper is skipped entirely and the topic controls the whole sentence.
export function parsePromptToken(raw: string): ParsedPromptToken | null {
  if (!raw.startsWith(PROMPT_TOKEN_PREFIX)) return null;
  try {
    const parsed = JSON.parse(raw.slice(PROMPT_TOKEN_PREFIX.length));
    if (parsed && typeof parsed.key === 'string' && parsed.params && typeof parsed.params === 'object') {
      return { key: parsed.key, params: parsed.params };
    }
  } catch {
    // not a token — treat as plain text, caller falls back to legacy behavior
  }
  return null;
}