import { v4 as uuid } from "uuid";
import type { PostRow, GenerationRequest } from "@/types";
import { generateCompletion } from "@/services/llm";
import { buildPostPrompt } from "@/utils/prompts";
import { getPersonalityById } from "@/utils/personalities";
import { useSettingsStore } from "@/stores/settingsStore";
import * as db from "@/services/database";

/**
 * Generate a single post from a generation request.
 */
export async function generatePost(
  request: GenerationRequest
): Promise<PostRow> {
  const personality = getPersonalityById(request.personalityId);
  if (!personality) {
    throw new Error(`Personality not found: ${request.personalityId}`);
  }

  const { language, postLength } = useSettingsStore.getState();

  const { system, user } = buildPostPrompt(request.postType, {
    personality,
    topic: request.topic,
    difficultyLevel: request.difficultyLevel,
    postLength,
    language,
    previousContext: request.previousContext,
    originalConcept: request.previousContext, // For spaced review
  });

  const content = await generateCompletion({
    systemPrompt: system,
    userPrompt: user,
  });

  const threadId =
    request.threadId ?? (request.postType === "deep_dive" ? uuid() : null);

  const postRow: PostRow = {
    id: uuid(),
    personality_id: request.personalityId,
    topic: request.topic,
    content,
    difficulty_level: request.difficultyLevel,
    post_type: request.postType,
    thread_id: threadId,
    created_at: new Date().toISOString(),
    is_read: 0,
    original_concept_id: request.originalConceptId ?? null,
  };

  // Store in database
  await db.insertPost(postRow);
  await db.incrementTopicPostCount(
    // Find topic id by name
    (await db.getActiveTopics()).find(
      (t) => t.name.toLowerCase() === request.topic.toLowerCase()
    )?.id ?? ""
  );

  return postRow;
}

/**
 * Generate a batch of posts in parallel.
 */
export async function generatePostBatch(
  requests: GenerationRequest[]
): Promise<PostRow[]> {
  const results = await Promise.allSettled(
    requests.map((req) => generatePost(req))
  );

  const posts: PostRow[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      posts.push(result.value);
    } else {
      console.warn("Failed to generate post:", result.reason);
    }
  }

  return posts;
}

/**
 * Generate discussion replies for a post.
 */
export async function generateDiscussion(
  postId: string
): Promise<void> {
  const post = await db.getPostById(postId);
  if (!post) return;

  const personality = getPersonalityById(post.personality_id);
  if (!personality) return;

  const { language, postLength } = useSettingsStore.getState();

  const { system, user } = await import("@/utils/prompts").then((m) =>
    m.buildDiscussionPrompt({
      personality,
      originalPost: post.content,
      topic: post.topic,
      language,
      postLength,
    })
  );

  const response = await generateCompletion({
    systemPrompt: system,
    userPrompt: user,
    maxTokens: 1500,
  });

  // Parse responses separated by ---
  const replies = response
    .split("---")
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  for (let i = 0; i < replies.length; i++) {
    const isQuestion = i % 2 === 0; // Alternating: question, answer, clarification
    await db.insertReply({
      id: uuid(),
      post_id: postId,
      personality_id: post.personality_id,
      content: replies[i],
      is_user_question: isQuestion ? 1 : 0,
      created_at: new Date(Date.now() + i * 1000).toISOString(), // Stagger timestamps
    });
  }
}

/**
 * Generate a reply to a user's question on a post.
 */
export async function generateUserReply(
  postId: string,
  userQuestion: string
): Promise<string> {
  const post = await db.getPostById(postId);
  if (!post) throw new Error("Post not found");

  const personality = getPersonalityById(post.personality_id);
  if (!personality) throw new Error("Personality not found");

  const { language, postLength } = useSettingsStore.getState();

  const { system, user } = await import("@/utils/prompts").then((m) =>
    m.buildReplyPrompt({
      personality,
      originalPost: post.content,
      question: userQuestion,
      language,
      postLength,
    })
  );

  const content = await generateCompletion({
    systemPrompt: system,
    userPrompt: user,
  });

  // Store the user question
  await db.insertReply({
    id: uuid(),
    post_id: postId,
    personality_id: post.personality_id,
    content: userQuestion,
    is_user_question: 1,
    created_at: new Date().toISOString(),
  });

  // Store the AI reply
  await db.insertReply({
    id: uuid(),
    post_id: postId,
    personality_id: post.personality_id,
    content,
    is_user_question: 0,
    created_at: new Date(Date.now() + 1000).toISOString(),
  });

  return content;
}
