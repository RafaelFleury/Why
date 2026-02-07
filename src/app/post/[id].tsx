import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PersonalityAvatar from "@/components/PersonalityAvatar";
import FeedbackButtons from "@/components/FeedbackButtons";
import ReplyComponent from "@/components/Reply";
import ProgressBar from "@/components/ProgressBar";
import { useFeedStore } from "@/stores/feedStore";
import { useTranslation } from "@/utils/i18n";
import { getPersonalityById } from "@/utils/personalities";
import { scheduleForReview } from "@/services/spacedRepetition";
import {
  generateDiscussion,
  generateUserReply,
} from "@/services/postGenerator";
import * as db from "@/services/database";
import type { Reply, Post } from "@/types";

function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${timeStr} · ${dateStr}`;
}

function personalityToHandle(name: string): string {
  return "@" + name.toLowerCase().replace(/[\s.]+/g, "_");
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { posts, toggleLike, toggleBookmark, submitFeedback } = useFeedStore();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [question, setQuestion] = useState("");
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

  const loadPost = useCallback(async () => {
    const storePost = posts.find((p) => p.id === id);
    if (storePost) {
      setPost(storePost);
    } else if (id) {
      const row = await db.getPostById(id);
      if (row) {
        const personality = getPersonalityById(row.personality_id);
        const isLiked = await db.hasInteraction(id, "like");
        const isBookmarked = await db.hasInteraction(id, "bookmark");
        setPost({
          id: row.id,
          personalityId: row.personality_id,
          personality: personality
            ? { ...personality, isFollowed: false }
            : undefined,
          topic: row.topic,
          content: row.content,
          difficultyLevel: row.difficulty_level,
          postType: row.post_type,
          threadId: row.thread_id,
          createdAt: row.created_at,
          isRead: row.is_read === 1,
          originalConceptId: row.original_concept_id,
          isLiked,
          isBookmarked,
          replyCount: 0,
        });
      }
    }
  }, [id, posts]);

  const loadReplies = useCallback(async () => {
    if (!id) return;
    const rows = await db.getRepliesForPost(id);
    setReplies(
      rows.map((r) => ({
        id: r.id,
        postId: r.post_id,
        personalityId: r.personality_id,
        personality: getPersonalityById(r.personality_id)
          ? { ...getPersonalityById(r.personality_id)!, isFollowed: false }
          : undefined,
        content: r.content,
        isUserQuestion: r.is_user_question === 1,
        createdAt: r.created_at,
      }))
    );
  }, [id]);

  useEffect(() => {
    loadPost();
    loadReplies();
    if (id) {
      db.markPostRead(id);
      db.recordInteraction(id, "time_spent", "1");
    }
  }, [id, loadPost, loadReplies]);

  useEffect(() => {
    if (id) {
      const storePost = posts.find((p) => p.id === id);
      if (storePost) setPost(storePost);
    }
  }, [posts, id]);

  const handleGenerateDiscussion = async () => {
    if (!id) return;
    setIsGeneratingReplies(true);
    try {
      await generateDiscussion(id);
      await loadReplies();
    } catch (error) {
      console.error("Failed to generate discussion:", error);
    } finally {
      setIsGeneratingReplies(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!id || !question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setIsGeneratingAnswer(true);
    try {
      await generateUserReply(id, q);
      await loadReplies();
    } catch (error) {
      console.error("Failed to generate reply:", error);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    toggleLike(post.id);
    if (!post.isLiked) {
      try {
        await scheduleForReview(post.id, post.topic, post.content);
      } catch {}
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    toggleBookmark(post.id);
    if (!post.isBookmarked) {
      try {
        await scheduleForReview(post.id, post.topic, post.content);
      } catch {}
    }
  };

  if (!post) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  const personalityName = post.personality?.name ?? "AI";
  const handle = personalityToHandle(personalityName);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Main Post */}
        <View className="px-4 pt-4 pb-0">
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <PersonalityAvatar
              emoji={post.personality?.avatarEmoji ?? "🤖"}
              size="md"
            />
            <View className="ml-3 flex-1">
              <Text className="text-text-primary font-bold text-[16px]">
                {personalityName}
              </Text>
              <Text className="text-text-secondary text-[14px]">
                {handle}
              </Text>
            </View>
            <TouchableOpacity className="p-2">
              <Ionicons name="ellipsis-horizontal" size={18} color="#536471" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text className="text-text-primary text-[17px] leading-[24px] mb-3">
            {post.content}
          </Text>

          {/* Topic + Difficulty */}
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-accent text-[14px]">
              #{post.topic.replace(/\s+/g, "")}
            </Text>
            <View className="flex-1">
              <ProgressBar level={post.difficultyLevel} showLabel={false} />
            </View>
          </View>

          {/* Timestamp */}
          <View className="border-b border-border pb-3 mb-1">
            <Text className="text-text-secondary text-[14px]">
              {formatFullDate(post.createdAt)}
            </Text>
          </View>

          {/* Action row */}
          <View className="border-b border-border pb-1">
            <FeedbackButtons
              isLiked={post.isLiked}
              isBookmarked={post.isBookmarked}
              replyCount={replies.length}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onReply={() => {}}
            />
          </View>

          {/* Difficulty feedback */}
          <View className="flex-row items-center gap-3 py-3 border-b border-border">
            <TouchableOpacity
              onPress={() => submitFeedback(post.id, "too_easy")}
              className="flex-row items-center gap-1.5 py-1 px-3 rounded-full"
              style={{ backgroundColor: "rgba(29,155,240,0.1)" }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down-outline" size={15} color="#1d9bf0" />
              <Text className="text-accent text-[13px] font-medium">
                {t("post.tooEasy")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => submitFeedback(post.id, "too_hard")}
              className="flex-row items-center gap-1.5 py-1 px-3 rounded-full"
              style={{ backgroundColor: "rgba(29,155,240,0.1)" }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up-outline" size={15} color="#1d9bf0" />
              <Text className="text-accent text-[13px] font-medium">
                {t("post.tooHard")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Replies section */}
        <View>
          {replies.length === 0 && !isGeneratingReplies && (
            <View className="py-6 items-center border-b border-border">
              <TouchableOpacity
                onPress={handleGenerateDiscussion}
                className="flex-row items-center gap-2 py-2 px-4 rounded-full"
                style={{ backgroundColor: "rgba(29,155,240,0.1)" }}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles-outline" size={16} color="#1d9bf0" />
                <Text className="text-accent text-[14px] font-medium">
                  {t("post.generateReplies")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isGeneratingReplies && (
            <View className="flex-row items-center justify-center gap-2 py-6">
              <ActivityIndicator size="small" color="#1d9bf0" />
              <Text className="text-text-muted text-[13px]">
                {t("feed.generating")}
              </Text>
            </View>
          )}

          {replies.map((reply) => (
            <ReplyComponent key={reply.id} reply={reply} />
          ))}

          {isGeneratingAnswer && (
            <View className="flex-row items-center justify-center gap-2 py-4 border-b border-border">
              <ActivityIndicator size="small" color="#1d9bf0" />
              <Text className="text-text-muted text-[13px]">Thinking...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Question input - X style */}
      <View
        className="border-t border-border px-4 py-2.5"
        style={{ backgroundColor: "#000000" }}
      >
        <View className="flex-row items-center gap-3">
          <PersonalityAvatar emoji="👤" size="sm" />
          <TextInput
            className="flex-1 text-text-primary text-[15px] py-2"
            value={question}
            onChangeText={setQuestion}
            placeholder={t("post.askQuestion")}
            placeholderTextColor="#536471"
            multiline
            maxLength={500}
            onSubmitEditing={handleSendQuestion}
          />
          <TouchableOpacity
            onPress={handleSendQuestion}
            disabled={!question.trim() || isGeneratingAnswer}
            className="rounded-full px-4 py-1.5"
            style={{
              backgroundColor:
                question.trim() && !isGeneratingAnswer
                  ? "#1d9bf0"
                  : "rgba(29,155,240,0.5)",
            }}
            activeOpacity={0.8}
          >
            <Text
              className="font-bold text-[14px]"
              style={{
                color:
                  question.trim() && !isGeneratingAnswer
                    ? "#ffffff"
                    : "rgba(255,255,255,0.5)",
              }}
            >
              Reply
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
