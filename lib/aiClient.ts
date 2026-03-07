import { getAI } from './gemini';

export function getAIClient() {
  return getAI();
}

export function formatAiError(error: unknown, prefix = 'AI_ERROR') {
  if (error instanceof Error) return `${prefix}: ${error.message}`;
  return `${prefix}: ${String(error)}`;
}
