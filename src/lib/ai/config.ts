/**
 * Single source of truth for the Claude AI model configuration.
 * Default model is claude-haiku-5-5, overridable via CLAUDE_MODEL env var.
 */
export const DEFAULT_CLAUDE_MODEL = 'claude-haiku-5-5';

let hasLoggedModel = false;

/**
 * Logs the active Claude model ID on startup.
 * Never prints API keys, tokens, or any secrets.
 */
export function logModelStartup(): void {
  if (!hasLoggedModel && typeof window === 'undefined') {
    hasLoggedModel = true;
    console.log(`[Radd AI] Active model: ${process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL}`);
  }
}

export function getClaudeModel(): string {
  logModelStartup();
  return process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL;
}
