import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type { Post as PostType } from "@/types";
import PersonalityAvatar from "./PersonalityAvatar";
import FeedbackButtons from "./FeedbackButtons";
import { useFeedStore } from "@/stores/feedStore";
import { useTranslation } from "@/utils/i18n";
import { scheduleForReview } from "@/services/spacedRepetition";

interface PostProps {
  post: PostType;
}

function getPostTypeLabel(
  postType: string,
  t: (key: any) => string
): string | null {
  switch (postType) {
    case "quiz":
      return t("post.quiz");
    case "deep_dive":
      return t("post.deepDive");
    case "spaced_review":
      return t("post.spacedReview");
    case "sequential":
      return t("post.sequential");
    default:
      return null;
  }
}

function getPostTypeTextColor(postType: string): string {
  switch (postType) {
    case "quiz":
      return "#ffd400";
    case "deep_dive":
      return "#1d9bf0";
    case "spaced_review":
      return "#00ba7c";
    case "sequential":
      return "#7856ff";
    default:
      return "#536471";
  }
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

function personalityToHandle(name: string): string {
  return "@" + name.toLowerCase().replace(/[\s.]+/g, "_");
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { toggleLike, toggleBookmark, submitFeedback } = useFeedStore();

  const typeLabel = getPostTypeLabel(post.postType, t);
  const personalityName = post.personality?.name ?? "AI";
  const handle = personalityToHandle(personalityName);

  const handleLike = async () => {
    toggleLike(post.id);
    if (!post.isLiked) {
      try {
        await scheduleForReview(post.id, post.topic, post.content);
      } catch {}
    }
  };

  const handleBookmark = async () => {
    toggleBookmark(post.id);
    if (!post.isBookmarked) {
      try {
        await scheduleForReview(post.id, post.topic, post.content);
      } catch {}
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.97}
      onPress={() => router.push(`/post/${post.id}`)}
      className="border-b border-border px-4 pt-3 pb-1"
    >
      <View className="flex-row">
        {/* Avatar column */}
        <View className="mr-3 pt-0.5">
          <PersonalityAvatar
            emoji={post.personality?.avatarEmoji ?? "🤖"}
            size="sm"
          />
        </View>

        {/* Content column */}
        <View className="flex-1">
          {/* Header: Name, handle, dot, timestamp */}
          <View className="flex-row items-center mb-0.5">
            <Text className="text-text-primary font-bold text-[15px]">
              {personalityName}
            </Text>
            <Text className="text-text-secondary text-[14px] ml-1">
              {handle}
            </Text>
            <Text className="text-text-secondary text-[14px] mx-1">
              ·
            </Text>
            <Text className="text-text-secondary text-[14px]">
              {formatTimestamp(post.createdAt)}
            </Text>
          </View>

          {/* Topic + Post type inline */}
          <View className="flex-row items-center mb-1.5 flex-wrap gap-1.5">
            <Text className="text-accent text-[13px]">
              #{post.topic.replace(/\s+/g, "")}
            </Text>
            {typeLabel && (
              <Text
                className="text-[12px] font-medium"
                style={{ color: getPostTypeTextColor(post.postType) }}
              >
                · {typeLabel}
              </Text>
            )}
          </View>

          {/* Content */}
          <Text className="text-text-primary text-[15px] leading-[21px]">
            {post.content}
          </Text>

          {/* Feedback buttons */}
          <FeedbackButtons
            isLiked={post.isLiked}
            isBookmarked={post.isBookmarked}
            replyCount={post.replyCount}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onReply={() => router.push(`/post/${post.id}`)}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
