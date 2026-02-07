import * as db from "@/services/database";
import { generateCompletion } from "@/services/llm";
import { buildConceptExtractionPrompt } from "@/utils/prompts";
import { useSettingsStore } from "@/stores/settingsStore";
import { SPACED_REPETITION_INTERVALS } from "@/utils/constants";

/**
 * Schedule a post's concept for spaced repetition review.
 * Called when a user likes or bookmarks a post.
 */
export async function scheduleForReview(
  postId: string,
  topic: string,
  content: string
): Promise<void> {
  const { language } = useSettingsStore.getState();

  // Extract core concept using LLM
  let conceptSummary: string;
  try {
    const { system, user } = buildConceptExtractionPrompt(content, language);
    conceptSummary = await generateCompletion({
      systemPrompt: system,
      userPrompt: user,
      maxTokens: 100,
      temperature: 0.3,
    });
  } catch {
    // If LLM fails, use first 200 chars as concept summary
    conceptSummary = content.substring(0, 200);
  }

  // Schedule first review for 1 day from now
  const nextReviewAt = new Date(
    Date.now() + SPACED_REPETITION_INTERVALS[0] * 24 * 60 * 60 * 1000
  ).toISOString();

  await db.insertSpacedRepetition({
    post_id: postId,
    topic,
    concept_summary: conceptSummary,
    next_review_at: nextReviewAt,
    interval_days: SPACED_REPETITION_INTERVALS[0],
    review_count: 0,
  });
}

/**
 * Advance a review item to the next interval.
 * Called after a spaced review post is generated and shown.
 */
export async function advanceReview(reviewId: number): Promise<void> {
  const database = await db.getDatabase();
  const item = await database.getFirstAsync<{
    id: number;
    interval_days: number;
    review_count: number;
  }>(
    "SELECT id, interval_days, review_count FROM spaced_repetition_schedule WHERE id = ?",
    [reviewId]
  );

  if (!item) return;

  const currentIndex = SPACED_REPETITION_INTERVALS.indexOf(item.interval_days);
  const nextIndex = Math.min(
    currentIndex + 1,
    SPACED_REPETITION_INTERVALS.length - 1
  );
  const nextInterval = SPACED_REPETITION_INTERVALS[nextIndex];

  // If we've completed all intervals, delete the schedule entry
  if (currentIndex >= SPACED_REPETITION_INTERVALS.length - 1) {
    await db.deleteReviewSchedule(reviewId);
    return;
  }

  const nextReviewAt = new Date(
    Date.now() + nextInterval * 24 * 60 * 60 * 1000
  ).toISOString();

  await db.updateReviewSchedule(
    reviewId,
    nextReviewAt,
    nextInterval,
    item.review_count + 1
  );
}

/**
 * Reset a review item back to the first interval.
 * Called when user marks a post as "too hard".
 */
export async function resetReview(
  postId: string,
  topic: string
): Promise<void> {
  const database = await db.getDatabase();

  // Find existing schedule for this post
  const item = await database.getFirstAsync<{ id: number }>(
    "SELECT id FROM spaced_repetition_schedule WHERE post_id = ? AND topic = ?",
    [postId, topic]
  );

  if (item) {
    const nextReviewAt = new Date(
      Date.now() + SPACED_REPETITION_INTERVALS[0] * 24 * 60 * 60 * 1000
    ).toISOString();

    await db.updateReviewSchedule(
      item.id,
      nextReviewAt,
      SPACED_REPETITION_INTERVALS[0],
      0
    );
  }
}

/**
 * Skip to the next interval for a review.
 * Called when user marks a post as "too easy".
 */
export async function skipReviewAhead(
  postId: string,
  topic: string
): Promise<void> {
  const database = await db.getDatabase();

  const item = await database.getFirstAsync<{
    id: number;
    interval_days: number;
    review_count: number;
  }>(
    "SELECT id, interval_days, review_count FROM spaced_repetition_schedule WHERE post_id = ? AND topic = ?",
    [postId, topic]
  );

  if (!item) return;

  const currentIndex = SPACED_REPETITION_INTERVALS.indexOf(item.interval_days);
  // Skip 2 levels ahead
  const nextIndex = Math.min(
    currentIndex + 2,
    SPACED_REPETITION_INTERVALS.length - 1
  );

  if (nextIndex >= SPACED_REPETITION_INTERVALS.length - 1) {
    await db.deleteReviewSchedule(item.id);
    return;
  }

  const nextInterval = SPACED_REPETITION_INTERVALS[nextIndex];
  const nextReviewAt = new Date(
    Date.now() + nextInterval * 24 * 60 * 60 * 1000
  ).toISOString();

  await db.updateReviewSchedule(
    item.id,
    nextReviewAt,
    nextInterval,
    item.review_count + 1
  );
}
