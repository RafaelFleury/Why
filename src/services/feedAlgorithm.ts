import type { PostType, TopicWeight, GenerationRequest, Topic } from "@/types";
import { POST_TYPE_WEIGHTS, FEED_BATCH_SIZE } from "@/utils/constants";
import {
  getPersonalitiesForPostType,
  PERSONALITIES,
} from "@/utils/personalities";
import * as db from "@/services/database";
import { getDueReviews } from "@/services/database";

/**
 * Calculate weighted distribution of topics based on engagement scores.
 * Higher engagement = more posts about that topic.
 */
function calculateTopicWeights(topics: Topic[]): TopicWeight[] {
  const activeTopics = topics.filter((t) => t.isActive);
  if (activeTopics.length === 0) return [];

  const baseWeight = 1 / activeTopics.length;
  const totalEngagement = activeTopics.reduce(
    (sum, t) => sum + t.engagementScore,
    0
  );

  return activeTopics.map((topic) => {
    // Base weight + engagement bonus (normalized)
    const engagementBonus =
      totalEngagement > 0
        ? (topic.engagementScore / totalEngagement) * 0.5
        : 0;
    const weight = baseWeight + engagementBonus;

    return {
      topicId: topic.id,
      topicName: topic.name,
      weight,
      currentDifficulty: topic.currentDifficulty,
    };
  });
}

/**
 * Select a topic using weighted random selection.
 */
function selectWeightedTopic(weights: TopicWeight[]): TopicWeight {
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of weights) {
    random -= w.weight;
    if (random <= 0) return w;
  }

  return weights[weights.length - 1];
}

/**
 * Select a post type using weighted random selection.
 */
function selectPostType(): PostType {
  const entries = Object.entries(POST_TYPE_WEIGHTS) as [PostType, number][];
  let random = Math.random();

  for (const [type, weight] of entries) {
    random -= weight;
    if (random <= 0) return type;
  }

  return "standalone";
}

/**
 * Pick a personality appropriate for the post type.
 * Prefers followed personalities but rotates others.
 */
async function selectPersonality(
  postType: PostType
): Promise<string> {
  const compatible = getPersonalitiesForPostType(postType);
  if (compatible.length === 0) return PERSONALITIES[0].id;

  // Check which personalities are followed
  const followed = await db.getFollowedPersonalities();
  const followedIds = new Set(followed.map((p) => p.id));

  // 70% chance to pick a followed personality (if any are followed)
  const followedCompatible = compatible.filter((p) =>
    followedIds.has(p.id)
  );

  if (followedCompatible.length > 0 && Math.random() < 0.7) {
    const idx = Math.floor(Math.random() * followedCompatible.length);
    return followedCompatible[idx].id;
  }

  // Otherwise random from all compatible
  const idx = Math.floor(Math.random() * compatible.length);
  return compatible[idx].id;
}

/**
 * Generate a batch of generation requests for the feed.
 */
export async function generateFeedBatch(
  topics: Topic[],
  batchSize: number = FEED_BATCH_SIZE
): Promise<GenerationRequest[]> {
  const requests: GenerationRequest[] = [];
  const weights = calculateTopicWeights(topics);

  if (weights.length === 0) return [];

  // Step 1: Check for due spaced repetition reviews (max 1 per batch)
  const dueReviews = await getDueReviews();
  if (dueReviews.length > 0) {
    const review = dueReviews[0];
    const personalityId = await selectPersonality("spaced_review");
    requests.push({
      topic: review.topic,
      personalityId,
      postType: "spaced_review",
      difficultyLevel:
        weights.find(
          (w) => w.topicName.toLowerCase() === review.topic.toLowerCase()
        )?.currentDifficulty ?? 2,
      originalConceptId: review.post_id,
      previousContext: review.concept_summary,
    });
  }

  // Step 2: Fill remaining batch with new posts
  while (requests.length < batchSize) {
    const selectedTopic = selectWeightedTopic(weights);
    const postType = selectPostType();
    const personalityId = await selectPersonality(postType);

    const request: GenerationRequest = {
      topic: selectedTopic.topicName,
      personalityId,
      postType,
      difficultyLevel: selectedTopic.currentDifficulty,
    };

    // For sequential / deep_dive, try to get previous context
    if (postType === "sequential" || postType === "deep_dive") {
      const recentPosts = await db.getPostsByTopic(
        selectedTopic.topicName,
        3
      );
      if (recentPosts.length > 0) {
        request.previousContext = recentPosts
          .map((p) => p.content)
          .join("\n\n---\n\n");

        // For deep dive, use or create a thread
        if (postType === "deep_dive") {
          const existingThread = recentPosts.find((p) => p.thread_id);
          request.threadId = existingThread?.thread_id ?? undefined;
        }
      }
    }

    requests.push(request);
  }

  return requests;
}
