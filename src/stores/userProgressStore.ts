import { create } from "zustand";
import * as db from "@/services/database";
import type { Topic, TopicRow, WeeklyStats } from "@/types";
import { ENGAGEMENT_DELTAS } from "@/utils/constants";
import { v4 as uuid } from "uuid";

function rowToTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active === 1,
    initialDifficulty: row.initial_difficulty,
    currentDifficulty: row.current_difficulty,
    engagementScore: row.engagement_score,
    postCount: row.post_count,
    lastPostAt: row.last_post_at,
  };
}

interface UserProgressState {
  topics: Topic[];
  weeklyStats: WeeklyStats | null;
  isLoading: boolean;

  loadTopics: () => Promise<void>;
  addTopic: (name: string, difficulty?: number) => Promise<void>;
  removeTopic: (id: string) => Promise<void>;
  toggleTopicActive: (id: string) => Promise<void>;
  setTopicDifficulty: (id: string, difficulty: number) => Promise<void>;
  updateEngagement: (
    topicName: string,
    interactionType: string
  ) => Promise<void>;
  adjustDifficulty: (
    topicName: string,
    direction: "easier" | "harder"
  ) => Promise<void>;
  loadWeeklyStats: () => Promise<void>;
}

export const useUserProgressStore = create<UserProgressState>((set, get) => ({
  topics: [],
  weeklyStats: null,
  isLoading: false,

  loadTopics: async () => {
    set({ isLoading: true });
    const rows = await db.getTopics();
    set({ topics: rows.map(rowToTopic), isLoading: false });
  },

  addTopic: async (name: string, difficulty: number = 1) => {
    const id = uuid();
    const topicRow: TopicRow = {
      id,
      name,
      is_active: 1,
      initial_difficulty: difficulty,
      current_difficulty: difficulty,
      engagement_score: 0,
      post_count: 0,
      last_post_at: null,
    };
    await db.upsertTopic(topicRow);
    const topics = [...get().topics, rowToTopic(topicRow)];
    set({ topics });
  },

  removeTopic: async (id: string) => {
    await db.deleteTopic(id);
    set({ topics: get().topics.filter((t) => t.id !== id) });
  },

  toggleTopicActive: async (id: string) => {
    const topic = get().topics.find((t) => t.id === id);
    if (!topic) return;
    const newActive = !topic.isActive;
    await db.setTopicActive(id, newActive);
    set({
      topics: get().topics.map((t) =>
        t.id === id ? { ...t, isActive: newActive } : t
      ),
    });
  },

  setTopicDifficulty: async (id: string, difficulty: number) => {
    await db.updateTopicDifficulty(id, difficulty);
    set({
      topics: get().topics.map((t) =>
        t.id === id ? { ...t, currentDifficulty: difficulty } : t
      ),
    });
  },

  updateEngagement: async (topicName: string, interactionType: string) => {
    const topic = get().topics.find(
      (t) => t.name.toLowerCase() === topicName.toLowerCase()
    );
    if (!topic) return;

    const delta = ENGAGEMENT_DELTAS[interactionType] ?? 0;
    if (delta === 0) return;

    await db.updateTopicEngagement(topic.id, delta);
    set({
      topics: get().topics.map((t) =>
        t.id === topic.id
          ? {
              ...t,
              engagementScore: Math.max(0, t.engagementScore + delta),
            }
          : t
      ),
    });
  },

  adjustDifficulty: async (
    topicName: string,
    direction: "easier" | "harder"
  ) => {
    const topic = get().topics.find(
      (t) => t.name.toLowerCase() === topicName.toLowerCase()
    );
    if (!topic) return;

    const newDifficulty =
      direction === "harder"
        ? Math.min(5, topic.currentDifficulty + 1)
        : Math.max(1, topic.currentDifficulty - 1);

    await db.updateTopicDifficulty(topic.id, newDifficulty);
    set({
      topics: get().topics.map((t) =>
        t.id === topic.id
          ? { ...t, currentDifficulty: newDifficulty }
          : t
      ),
    });
  },

  loadWeeklyStats: async () => {
    const [totalPosts, totalLikes, totalBookmarks, topicBreakdown, reviewCount] =
      await Promise.all([
        db.getWeeklyPostCount(),
        db.getWeeklyInteractionCount("like"),
        db.getWeeklyInteractionCount("bookmark"),
        db.getWeeklyTopicBreakdown(),
        db.getWeeklyReviewCount(),
      ]);

    const activeTopics = get().topics.filter((t) => t.isActive);

    set({
      weeklyStats: {
        topicsStudied: topicBreakdown.map((t) => t.topic),
        totalPosts,
        totalLikes,
        totalBookmarks,
        topicBreakdown: topicBreakdown.map((tb) => {
          const topic = activeTopics.find(
            (t) => t.name.toLowerCase() === tb.topic.toLowerCase()
          );
          return {
            topic: tb.topic,
            count: tb.count,
            engagement: topic?.engagementScore ?? 0,
          };
        }),
        conceptsReviewed: reviewCount,
      },
    });
  },
}));
