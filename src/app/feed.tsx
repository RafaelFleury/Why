import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Post from "@/components/Post";
import PostSkeleton from "@/components/PostSkeleton";
import { useFeedStore } from "@/stores/feedStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUserProgressStore } from "@/stores/userProgressStore";
import { useTranslation } from "@/utils/i18n";
import { generateFeedBatch } from "@/services/feedAlgorithm";
import { generatePostBatch } from "@/services/postGenerator";
import type { Post as PostType } from "@/types";

export default function FeedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    posts,
    isGenerating,
    isLoading,
    loadPosts,
    addGeneratedPost,
    setGenerating,
  } = useFeedStore();
  const { isConfigured } = useSettingsStore();
  const { topics } = useUserProgressStore();
  const isLoadingRef = useRef(false);

  useEffect(() => {
    loadPosts(true);
  }, []);

  const generateNewPosts = useCallback(async () => {
    if (isLoadingRef.current || !isConfigured) return;
    isLoadingRef.current = true;
    setGenerating(true);

    try {
      const activeTopics = topics.filter((t) => t.isActive);
      if (activeTopics.length === 0) return;

      const requests = await generateFeedBatch(activeTopics);
      const newPosts = await generatePostBatch(requests);

      for (const post of newPosts) {
        await addGeneratedPost(post);
      }
    } catch (error) {
      console.error("Failed to generate posts:", error);
    } finally {
      setGenerating(false);
      isLoadingRef.current = false;
    }
  }, [isConfigured, topics]);

  const handleRefresh = useCallback(async () => {
    await loadPosts(true);
    if (isConfigured && topics.some((t) => t.isActive)) {
      await generateNewPosts();
    }
  }, [isConfigured, topics, generateNewPosts]);

  const handleEndReached = useCallback(() => {
    if (!isGenerating && isConfigured && topics.some((t) => t.isActive)) {
      generateNewPosts();
    }
  }, [isGenerating, isConfigured, topics, generateNewPosts]);

  const renderItem = useCallback(
    ({ item }: { item: PostType }) => <Post post={item} />,
    []
  );

  const keyExtractor = useCallback((item: PostType) => item.id, []);

  const hasActiveTopics = topics.some((t) => t.isActive);

  // Setup required screen
  if (!isConfigured || !hasActiveTopics) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="items-center max-w-sm w-full">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: "rgba(29,155,240,0.1)" }}
          >
            <Ionicons name="school-outline" size={28} color="#1d9bf0" />
          </View>
          <Text className="text-text-primary text-xl font-bold text-center mb-2">
            {t("feed.setupRequired")}
          </Text>
          <Text className="text-text-secondary text-[15px] text-center mb-6 leading-5">
            {t("feed.setupMessage")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="bg-accent rounded-full px-6 py-3 w-full"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-[15px] text-center">
              {t("feed.goToSettings")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#1d9bf0"
            colors={["#1d9bf0"]}
            progressBackgroundColor="#000000"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isGenerating ? (
            <View className="items-center py-16 px-8">
              <Ionicons name="sparkles-outline" size={36} color="#536471" />
              <Text className="text-text-secondary text-center mt-4 text-[15px]">
                {t("feed.empty")}
              </Text>
              <TouchableOpacity
                onPress={generateNewPosts}
                className="bg-accent mt-5 px-6 py-3 rounded-full"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-[15px]">
                  Generate Posts
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={
          isGenerating ? (
            <View>
              <PostSkeleton />
              <PostSkeleton />
              <View className="flex-row items-center justify-center gap-2 py-3">
                <ActivityIndicator size="small" color="#1d9bf0" />
                <Text className="text-text-muted text-xs">
                  {t("feed.generating")}
                </Text>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}
