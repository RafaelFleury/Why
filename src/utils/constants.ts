import type { PostLength } from "@/types";

export const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const POST_LENGTH_CHARS: Record<PostLength, number> = {
  short: 280,
  medium: 560,
  long: 1000,
};

export const DIFFICULTY_LABELS: Record<number, { en: string; "pt-BR": string }> = {
  1: { en: "Beginner", "pt-BR": "Iniciante" },
  2: { en: "Elementary", "pt-BR": "Elementar" },
  3: { en: "Intermediate", "pt-BR": "Intermediário" },
  4: { en: "Advanced", "pt-BR": "Avançado" },
  5: { en: "Expert", "pt-BR": "Especialista" },
};

export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30]; // days

export const FEED_BATCH_SIZE = 3;

export const POST_TYPE_WEIGHTS = {
  standalone: 0.60,
  sequential: 0.15,
  quiz: 0.10,
  deep_dive: 0.10,
  spaced_review: 0.05,
} as const;

export const ENGAGEMENT_DELTAS: Record<string, number> = {
  like: 2,
  bookmark: 3,
  too_easy: -1,
  too_hard: -1,
  time_spent: 0.5, // per read
};
