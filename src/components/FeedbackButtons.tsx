import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FeedbackButtonsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  replyCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onReply: () => void;
  onShare?: () => void;
}

export default function FeedbackButtons({
  isLiked,
  isBookmarked,
  replyCount,
  onLike,
  onBookmark,
  onReply,
  onShare,
}: FeedbackButtonsProps) {
  return (
    <View className="flex-row items-center justify-between mt-3 -ml-2">
      {/* Reply */}
      <TouchableOpacity
        onPress={onReply}
        className="flex-row items-center gap-1.5 py-1.5 px-2"
        activeOpacity={0.6}
      >
        <Ionicons name="chatbubble-outline" size={17} color="#536471" />
        {replyCount > 0 && (
          <Text className="text-text-muted text-xs">{replyCount}</Text>
        )}
      </TouchableOpacity>

      {/* Repost / Share */}
      <TouchableOpacity
        onPress={onShare}
        className="flex-row items-center gap-1.5 py-1.5 px-2"
        activeOpacity={0.6}
      >
        <Ionicons name="repeat-outline" size={18} color="#536471" />
      </TouchableOpacity>

      {/* Like */}
      <TouchableOpacity
        onPress={onLike}
        className="flex-row items-center gap-1.5 py-1.5 px-2"
        activeOpacity={0.6}
      >
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={17}
          color={isLiked ? "#f4212e" : "#536471"}
        />
      </TouchableOpacity>

      {/* Bookmark */}
      <TouchableOpacity
        onPress={onBookmark}
        className="flex-row items-center gap-1.5 py-1.5 px-2"
        activeOpacity={0.6}
      >
        <Ionicons
          name={isBookmarked ? "bookmark" : "bookmark-outline"}
          size={17}
          color={isBookmarked ? "#1d9bf0" : "#536471"}
        />
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity
        onPress={() => {}}
        className="flex-row items-center gap-1.5 py-1.5 px-2"
        activeOpacity={0.6}
      >
        <Ionicons name="share-outline" size={17} color="#536471" />
      </TouchableOpacity>
    </View>
  );
}
