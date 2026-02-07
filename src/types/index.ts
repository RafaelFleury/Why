// ============================================================
// Database row types (match SQLite schema exactly)
// ============================================================

export interface SettingRow {
  key: string;
  value: string;
}

export interface PersonalityRow {
  id: string;
  name: string;
  bio: string;
  teaching_style: string;
  avatar_emoji: string;
  is_followed: number; // 0 or 1
}

export interface PostRow {
  id: string;
  personality_id: string;
  topic: string;
  content: string;
  difficulty_level: number;
  post_type: PostType;
  thread_id: string | null;
  created_at: string;
  is_read: number; // 0 or 1
  original_concept_id: string | null;
}

export interface ReplyRow {
  id: string;
  post_id: string;
  personality_id: string;
  content: string;
  is_user_question: number; // 0 or 1
  created_at: string;
}

export interface UserInteractionRow {
  id: number;
  post_id: string;
  interaction_type: InteractionType;
  value: string | null;
  created_at: string;
}

export interface TopicRow {
  id: string;
  name: string;
  is_active: number; // 0 or 1
  initial_difficulty: number;
  current_difficulty: number;
  engagement_score: number;
  post_count: number;
  last_post_at: string | null;
}

export interface SpacedRepetitionRow {
  id: number;
  post_id: string;
  topic: string;
  concept_summary: string;
  next_review_at: string;
  interval_days: number;
  review_count: number;
}

// ============================================================
// Application types (enriched / transformed for UI use)
// ============================================================

export type PostType =
  | "standalone"
  | "sequential"
  | "quiz"
  | "deep_dive"
  | "spaced_review";

export type InteractionType =
  | "like"
  | "bookmark"
  | "too_easy"
  | "too_hard"
  | "time_spent";

export type Language = "pt-BR" | "en";

export type PostLength = "short" | "medium" | "long";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface Personality {
  id: string;
  name: string;
  bio: string;
  teachingStyle: string;
  avatarEmoji: string;
  isFollowed: boolean;
  systemPrompt: string;
  compatiblePostTypes: PostType[];
}

export interface Post {
  id: string;
  personalityId: string;
  personality?: Personality;
  topic: string;
  content: string;
  difficultyLevel: number;
  postType: PostType;
  threadId: string | null;
  createdAt: string;
  isRead: boolean;
  originalConceptId: string | null;
  // Enriched fields (from joins / computed)
  isLiked: boolean;
  isBookmarked: boolean;
  replyCount: number;
}

export interface Reply {
  id: string;
  postId: string;
  personalityId: string;
  personality?: Personality;
  content: string;
  isUserQuestion: boolean;
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  isActive: boolean;
  initialDifficulty: number;
  currentDifficulty: number;
  engagementScore: number;
  postCount: number;
  lastPostAt: string | null;
}

export interface SpacedRepetitionItem {
  id: number;
  postId: string;
  topic: string;
  conceptSummary: string;
  nextReviewAt: string;
  intervalDays: number;
  reviewCount: number;
}

export interface AppSettings {
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  postLength: PostLength;
  language: Language;
}

export interface WeeklyStats {
  topicsStudied: string[];
  totalPosts: number;
  totalLikes: number;
  totalBookmarks: number;
  topicBreakdown: { topic: string; count: number; engagement: number }[];
  conceptsReviewed: number;
}

// ============================================================
// Feed algorithm types
// ============================================================

export interface TopicWeight {
  topicId: string;
  topicName: string;
  weight: number;
  currentDifficulty: number;
}

export interface GenerationRequest {
  topic: string;
  personalityId: string;
  postType: PostType;
  difficultyLevel: number;
  threadId?: string;
  originalConceptId?: string;
  previousContext?: string;
}
