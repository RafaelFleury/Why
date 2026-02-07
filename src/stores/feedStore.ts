import { create } from "zustand";
import * as db from "@/services/database";
import type { Post, PostRow, PersonalityRow, InteractionType } from "@/types";
import { useUserProgressStore } from "./userProgressStore";

function postRowToPost(
  row: PostRow,
  personalityMap: Map<string, PersonalityRow>,
  likedIds: Set<string>,
  bookmarkedIds: Set<string>,
  replyCounts: Record<string, number>
): Post {
  const personality = personalityMap.get(row.personality_id);
  return {
    id: row.id,
    personalityId: row.personality_id,
    personality: personality
      ? {
          id: personality.id,
          name: personality.name,
          bio: personality.bio,
          teachingStyle: personality.teaching_style,
          avatarEmoji: personality.avatar_emoji,
          isFollowed: personality.is_followed === 1,
          systemPrompt: "",
          compatiblePostTypes: [],
        }
      : undefined,
    topic: row.topic,
    content: row.content,
    difficultyLevel: row.difficulty_level,
    postType: row.post_type,
    threadId: row.thread_id,
    createdAt: row.created_at,
    isRead: row.is_read === 1,
    originalConceptId: row.original_concept_id,
    isLiked: likedIds.has(row.id),
    isBookmarked: bookmarkedIds.has(row.id),
    replyCount: replyCounts[row.id] ?? 0,
  };
}

interface FeedState {
  posts: Post[];
  isGenerating: boolean;
  isLoading: boolean;
  hasMore: boolean;
  page: number;

  loadPosts: (reset?: boolean) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  addGeneratedPost: (postRow: PostRow) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
  submitFeedback: (
    postId: string,
    type: "too_easy" | "too_hard"
  ) => Promise<void>;
  setGenerating: (value: boolean) => void;
}

const PAGE_SIZE = 20;

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  isGenerating: false,
  isLoading: false,
  hasMore: true,
  page: 0,

  loadPosts: async (reset = false) => {
    set({ isLoading: true });
    const page = reset ? 0 : get().page;
    const rows = await db.getPosts(PAGE_SIZE, page * PAGE_SIZE);

    const personalityRows = await db.getPersonalities();
    const personalityMap = new Map(personalityRows.map((p) => [p.id, p]));
    const likedIds = await db.getLikedPostIds();
    const bookmarkedIds = await db.getBookmarkedPostIds();
    const replyCounts = await db.getReplyCountsForPosts(
      rows.map((r) => r.id)
    );

    const posts = rows.map((row) =>
      postRowToPost(row, personalityMap, likedIds, bookmarkedIds, replyCounts)
    );

    set({
      posts: reset ? posts : [...get().posts, ...posts],
      isLoading: false,
      hasMore: rows.length === PAGE_SIZE,
      page: page + 1,
    });
  },

  loadMorePosts: async () => {
    if (get().isLoading || !get().hasMore) return;
    await get().loadPosts();
  },

  addGeneratedPost: async (postRow: PostRow) => {
    const personalityRows = await db.getPersonalities();
    const personalityMap = new Map(personalityRows.map((p) => [p.id, p]));
    const likedIds = await db.getLikedPostIds();
    const bookmarkedIds = await db.getBookmarkedPostIds();

    const post = postRowToPost(
      postRow,
      personalityMap,
      likedIds,
      bookmarkedIds,
      {}
    );

    set({ posts: [post, ...get().posts] });
  },

  toggleLike: async (postId: string) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.isLiked) {
      await db.removeInteraction(postId, "like");
    } else {
      await db.recordInteraction(postId, "like");
    }

    // Update engagement
    const topicName = post.topic;
    if (post.isLiked) {
      useUserProgressStore.getState().updateEngagement(topicName, "unlike");
    } else {
      useUserProgressStore.getState().updateEngagement(topicName, "like");
    }

    set({
      posts: get().posts.map((p) =>
        p.id === postId ? { ...p, isLiked: !p.isLiked } : p
      ),
    });
  },

  toggleBookmark: async (postId: string) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.isBookmarked) {
      await db.removeInteraction(postId, "bookmark");
    } else {
      await db.recordInteraction(postId, "bookmark");
    }

    if (!post.isBookmarked) {
      useUserProgressStore.getState().updateEngagement(post.topic, "bookmark");
    }

    set({
      posts: get().posts.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      ),
    });
  },

  submitFeedback: async (postId, type) => {
    await db.recordInteraction(postId, type);

    const post = get().posts.find((p) => p.id === postId);
    if (post) {
      const progressStore = useUserProgressStore.getState();
      progressStore.updateEngagement(post.topic, type);

      if (type === "too_easy") {
        progressStore.adjustDifficulty(post.topic, "harder");
      } else if (type === "too_hard") {
        progressStore.adjustDifficulty(post.topic, "easier");
      }
    }
  },

  setGenerating: (value: boolean) => {
    set({ isGenerating: value });
  },
}));
