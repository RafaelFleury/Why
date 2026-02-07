import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserProgressStore } from "@/stores/userProgressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTranslation } from "@/utils/i18n";
import { generateCompletion } from "@/services/llm";
import { buildRecapPrompt } from "@/utils/prompts";
import ProgressBar from "@/components/ProgressBar";

function StatCard({
  icon,
  label,
  value,
  color = "#1d9bf0",
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <View
      className="flex-1 p-4 rounded-2xl items-center"
      style={{ backgroundColor: "#16181c" }}
    >
      <Ionicons name={icon as any} size={22} color={color} />
      <Text className="text-text-primary text-xl font-bold mt-2">
        {value}
      </Text>
      <Text className="text-text-muted text-[12px] mt-1 text-center">
        {label}
      </Text>
    </View>
  );
}

export default function RecapScreen() {
  const { t } = useTranslation();
  const { weeklyStats, loadWeeklyStats, topics } = useUserProgressStore();
  const settings = useSettingsStore();
  const [recapSummary, setRecapSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await loadWeeklyStats();
      setIsLoading(false);
    }
    load();
  }, []);

  const handleGenerateRecap = async () => {
    if (!weeklyStats || !settings.isConfigured) return;
    setIsGeneratingSummary(true);

    try {
      const { system, user } = buildRecapPrompt({
        language: settings.language,
        topicsStudied: weeklyStats.topicsStudied,
        totalPosts: weeklyStats.totalPosts,
        totalLikes: weeklyStats.totalLikes,
        conceptsReviewed: weeklyStats.conceptsReviewed,
        topicBreakdown: weeklyStats.topicBreakdown,
      });

      const summary = await generateCompletion({
        systemPrompt: system,
        userPrompt: user,
        maxTokens: 500,
        temperature: 0.7,
      });

      setRecapSummary(summary);
    } catch (error) {
      console.error("Failed to generate recap:", error);
      setRecapSummary(
        settings.language === "pt-BR"
          ? "Nao foi possivel gerar o resumo. Verifique sua chave de API."
          : "Failed to generate summary. Check your API key."
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  const hasActivity = weeklyStats && weeklyStats.totalPosts > 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {!hasActivity ? (
        <View className="flex-1 items-center justify-center px-8 pt-32">
          <Ionicons name="calendar-outline" size={36} color="#536471" />
          <Text className="text-text-secondary text-center mt-4 text-[15px]">
            {t("recap.noActivity")}
          </Text>
        </View>
      ) : (
        <>
          {/* Stats grid */}
          <View className="px-4 pt-4">
            <View className="flex-row gap-2.5 mb-2.5">
              <StatCard
                icon="newspaper-outline"
                label={t("recap.postsThisWeek")}
                value={weeklyStats!.totalPosts}
              />
              <StatCard
                icon="school-outline"
                label={t("recap.topicsStudied")}
                value={weeklyStats!.topicsStudied.length}
                color="#7856ff"
              />
            </View>
            <View className="flex-row gap-2.5 mb-2.5">
              <StatCard
                icon="heart-outline"
                label={t("recap.likes")}
                value={weeklyStats!.totalLikes}
                color="#f4212e"
              />
              <StatCard
                icon="bookmark-outline"
                label={t("recap.bookmarks")}
                value={weeklyStats!.totalBookmarks}
                color="#ffd400"
              />
              <StatCard
                icon="refresh-outline"
                label={t("recap.conceptsReviewed")}
                value={weeklyStats!.conceptsReviewed}
                color="#00ba7c"
              />
            </View>
          </View>

          {/* Topic Breakdown */}
          {weeklyStats!.topicBreakdown.length > 0 && (
            <View className="mt-2">
              <View className="px-4 py-3 border-b border-border">
                <Text className="text-text-primary font-bold text-[17px]">
                  {t("recap.topicBreakdown")}
                </Text>
              </View>
              {weeklyStats!.topicBreakdown.map((item) => {
                const topic = topics.find(
                  (t) =>
                    t.name.toLowerCase() === item.topic.toLowerCase()
                );
                return (
                  <View
                    key={item.topic}
                    className="border-b border-border px-4 py-3"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-text-primary font-bold text-[15px]">
                        {item.topic}
                      </Text>
                      <Text className="text-text-secondary text-[13px]">
                        {item.count} posts
                      </Text>
                    </View>
                    {topic && (
                      <ProgressBar level={topic.currentDifficulty} />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Progress */}
          <View className="mt-2">
            <View className="px-4 py-3 border-b border-border">
              <Text className="text-text-primary font-bold text-[17px]">
                {t("recap.progress")}
              </Text>
            </View>
            {topics
              .filter((t) => t.isActive)
              .map((topic) => (
                <View
                  key={topic.id}
                  className="border-b border-border px-4 py-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-text-primary font-bold text-[15px]">
                      {topic.name}
                    </Text>
                    <Text className="text-text-secondary text-[13px]">
                      {topic.postCount} total posts
                    </Text>
                  </View>
                  <ProgressBar level={topic.currentDifficulty} />
                </View>
              ))}
          </View>

          {/* AI Summary */}
          <View className="mt-2">
            <View className="px-4 py-3 border-b border-border">
              <Text className="text-text-primary font-bold text-[17px]">
                {t("recap.summary")}
              </Text>
            </View>

            {recapSummary ? (
              <View className="px-4 py-4 border-b border-border">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="sparkles" size={16} color="#1d9bf0" />
                  <Text className="text-accent text-[13px] font-bold">
                    AI Summary
                  </Text>
                </View>
                <Text className="text-text-primary text-[15px] leading-[22px]">
                  {recapSummary}
                </Text>
              </View>
            ) : (
              <View className="px-4 py-6 items-center border-b border-border">
                <TouchableOpacity
                  onPress={handleGenerateRecap}
                  disabled={isGeneratingSummary}
                  className="flex-row items-center gap-2 px-5 py-2.5 rounded-full"
                  style={{
                    backgroundColor: isGeneratingSummary
                      ? "rgba(29,155,240,0.5)"
                      : "#1d9bf0",
                  }}
                  activeOpacity={0.8}
                >
                  {isGeneratingSummary ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text className="text-white font-bold text-[14px]">
                        {t("recap.generating")}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles-outline" size={18} color="#ffffff" />
                      <Text className="text-white font-bold text-[14px]">
                        {t("recap.generate")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
