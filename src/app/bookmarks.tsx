import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PersonalityAvatar from "@/components/PersonalityAvatar";
import SearchBar from "@/components/SearchBar";
import { useTranslation } from "@/utils/i18n";
import { getPersonalityById } from "@/utils/personalities";
import * as db from "@/services/database";
import type { Post, PostRow } from "@/types";

interface BookmarkSection {
  title: string;
  data: Post[];
}

function rowToPost(row: PostRow, isLiked: boolean): Post {
  const personality = getPersonalityById(row.personality_id);
  return {
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
    isBookmarked: true,
    replyCount: 0,
  };
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

function nameToHandle(name: string): string {
  return "@" + name.toLowerCase().replace(/[\s.]+/g, "_");
}

export default function BookmarksScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sections, setSections] = useState<BookmarkSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    const rows = searchQuery.trim()
      ? await db.searchBookmarkedPosts(searchQuery.trim())
      : await db.getBookmarkedPosts();

    const likedIds = await db.getLikedPostIds();

    const grouped = new Map<string, Post[]>();
    for (const row of rows) {
      const post = rowToPost(row, likedIds.has(row.id));
      const topic = post.topic;
      if (!grouped.has(topic)) grouped.set(topic, []);
      grouped.get(topic)!.push(post);
    }

    const sectionData: BookmarkSection[] = Array.from(grouped.entries())
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => a.title.localeCompare(b.title));

    setSections(sectionData);
    setIsLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    const interval = setInterval(loadBookmarks, 5000);
    return () => clearInterval(interval);
  }, [loadBookmarks]);

  const renderItem = ({ item }: { item: Post }) => {
    const personalityName = item.personality?.name ?? "AI";
    const handle = nameToHandle(personalityName);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/post/${item.id}`)}
        className="border-b border-border px-4 pt-3 pb-3"
        activeOpacity={0.97}
      >
        <View className="flex-row">
          {/* Avatar */}
          <View className="mr-3 pt-0.5">
            <PersonalityAvatar
              emoji={item.personality?.avatarEmoji ?? "🤖"}
              size="sm"
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            {/* Header */}
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
                {formatTimestamp(item.createdAt)}
              </Text>
              <View className="flex-1" />
              {item.isLiked && (
                <Ionicons name="heart" size={14} color="#f4212e" />
              )}
            </View>

            {/* Content */}
            <Text
              className="text-text-primary text-[15px] leading-[21px]"
              numberOfLines={4}
            >
              {item.content}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: BookmarkSection;
  }) => (
    <View className="px-4 py-2.5 border-b border-border" style={{ backgroundColor: "#000000" }}>
      <View className="flex-row items-center gap-2">
        <Text className="text-text-primary font-bold text-[15px]">
          {section.title}
        </Text>
        <Text className="text-text-secondary text-[13px]">
          {section.data.length}{" "}
          {section.data.length === 1 ? "post" : "posts"}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="py-2.5 border-b border-border">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("bookmarks.search")}
        />
      </View>

      {sections.length === 0 && !isLoading ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="bookmark-outline" size={36} color="#536471" />
          <Text className="text-text-secondary text-center mt-4 text-[15px]">
            {t("bookmarks.empty")}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          stickySectionHeadersEnabled={true}
        />
      )}
    </View>
  );
}
