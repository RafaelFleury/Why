import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PersonalityAvatar from "@/components/PersonalityAvatar";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUserProgressStore } from "@/stores/userProgressStore";
import { useTranslation } from "@/utils/i18n";
import { clearAllData, getPersonalities, toggleFollowPersonality } from "@/services/database";
import ProgressBar from "@/components/ProgressBar";
import type { Language, PostLength, PersonalityRow } from "@/types";

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="px-4 pt-5 pb-2">
      <Text className="text-text-secondary text-[13px] font-bold uppercase tracking-wider">
        {title}
      </Text>
    </View>
  );
}

function SettingRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View className="border-b border-border px-4 py-3">
      <Text className="text-text-secondary text-[13px] mb-1.5 font-medium">
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const progressStore = useUserProgressStore();

  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDifficulty, setNewTopicDifficulty] = useState(1);
  const [personalities, setPersonalities] = useState<PersonalityRow[]>([]);
  const [personalitiesLoaded, setPersonalitiesLoaded] = useState(false);

  const loadPersonalities = useCallback(async () => {
    const rows = await getPersonalities();
    setPersonalities(rows);
    setPersonalitiesLoaded(true);
  }, []);

  React.useEffect(() => {
    loadPersonalities();
  }, [loadPersonalities]);

  const handleAddTopic = async () => {
    const name = newTopicName.trim();
    if (!name) return;
    await progressStore.addTopic(name, newTopicDifficulty);
    setNewTopicName("");
    setNewTopicDifficulty(1);
  };

  const handleToggleFollow = async (id: string, currentlyFollowed: number) => {
    const newFollowed = currentlyFollowed === 1 ? false : true;
    await toggleFollowPersonality(id, newFollowed);
    setPersonalities((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_followed: newFollowed ? 1 : 0 } : p
      )
    );
  };

  const handleClearData = () => {
    Alert.alert(
      t("settings.clearData"),
      t("settings.clearDataConfirm"),
      [
        { text: t("general.cancel"), style: "cancel" },
        {
          text: t("general.confirm"),
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            await progressStore.loadTopics();
            Alert.alert("Done", "All data cleared.");
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* API Configuration */}
      <SectionHeader title={t("settings.apiConfig")} />

      <SettingRow label={t("settings.apiKey")}>
        <TextInput
          className="text-text-primary text-[15px] py-1"
          value={settings.apiKey}
          onChangeText={(v) => settings.updateSetting("apiKey", v)}
          placeholder={t("settings.apiKeyPlaceholder")}
          placeholderTextColor="#536471"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </SettingRow>

      <SettingRow label={t("settings.baseURL")}>
        <TextInput
          className="text-text-primary text-[15px] py-1"
          value={settings.baseURL}
          onChangeText={(v) => settings.updateSetting("baseURL", v)}
          placeholder={t("settings.baseURLPlaceholder")}
          placeholderTextColor="#536471"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </SettingRow>

      <SettingRow label={t("settings.model")}>
        <TextInput
          className="text-text-primary text-[15px] py-1"
          value={settings.defaultModel}
          onChangeText={(v) => settings.updateSetting("defaultModel", v)}
          placeholder={t("settings.modelPlaceholder")}
          placeholderTextColor="#536471"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </SettingRow>

      {/* Topics */}
      <SectionHeader title={t("settings.topics")} />

      {/* Add topic input */}
      <View className="border-b border-border px-4 py-3">
        <View className="flex-row items-center gap-2 mb-3">
          <TextInput
            className="flex-1 text-text-primary text-[15px] px-3 py-2.5 rounded-full"
            style={{ backgroundColor: "#202327" }}
            value={newTopicName}
            onChangeText={setNewTopicName}
            placeholder={t("settings.topicName")}
            placeholderTextColor="#536471"
            onSubmitEditing={handleAddTopic}
          />
          <TouchableOpacity
            onPress={handleAddTopic}
            className="bg-accent w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-text-secondary text-[13px]">
            {t("settings.topicDifficulty")}:
          </Text>
          {[1, 2, 3, 4, 5].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setNewTopicDifficulty(d)}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  d === newTopicDifficulty ? "#1d9bf0" : "#2f3336",
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{
                  color: d === newTopicDifficulty ? "#ffffff" : "#71767b",
                }}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Topic list */}
      {progressStore.topics.length === 0 ? (
        <View className="py-6 items-center">
          <Text className="text-text-muted text-[14px]">
            {t("settings.noTopics")}
          </Text>
        </View>
      ) : (
        progressStore.topics.map((topic) => (
          <View
            key={topic.id}
            className="border-b border-border px-4 py-3"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2 flex-1">
                <Text className="text-text-primary font-bold text-[15px]">
                  {topic.name}
                </Text>
                {topic.isActive ? (
                  <Text className="text-success text-[12px]">
                    {t("settings.active")}
                  </Text>
                ) : (
                  <Text className="text-text-muted text-[12px]">
                    {t("settings.inactive")}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center gap-3">
                <Switch
                  value={topic.isActive}
                  onValueChange={() =>
                    progressStore.toggleTopicActive(topic.id)
                  }
                  trackColor={{ false: "#2f3336", true: "#1d9bf0" }}
                  thumbColor="#e7e9ea"
                />
                <TouchableOpacity
                  onPress={() => progressStore.removeTopic(topic.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#f4212e" />
                </TouchableOpacity>
              </View>
            </View>
            <ProgressBar level={topic.currentDifficulty} />
            <View className="flex-row items-center gap-1.5 mt-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => progressStore.setTopicDifficulty(topic.id, d)}
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{
                    backgroundColor:
                      d === topic.currentDifficulty ? "#1d9bf0" : "#2f3336",
                  }}
                >
                  <Text
                    className="text-xs"
                    style={{
                      color:
                        d === topic.currentDifficulty ? "#ffffff" : "#536471",
                    }}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))
      )}

      {/* Personalities */}
      <SectionHeader title={t("settings.personalities")} />

      {personalitiesLoaded &&
        personalities.map((p) => (
          <View
            key={p.id}
            className="border-b border-border px-4 py-3"
          >
            <View className="flex-row items-center">
              <PersonalityAvatar emoji={p.avatar_emoji} size="sm" />
              <View className="flex-1 ml-3">
                <Text className="text-text-primary font-bold text-[15px]">
                  {p.name}
                </Text>
                <Text className="text-text-secondary text-[13px]" numberOfLines={1}>
                  {p.bio}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleToggleFollow(p.id, p.is_followed)}
                className="rounded-full px-4 py-1.5"
                style={{
                  backgroundColor: p.is_followed === 1 ? "#e7e9ea" : "transparent",
                  borderWidth: p.is_followed === 1 ? 0 : 1,
                  borderColor: "#536471",
                }}
                activeOpacity={0.8}
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{
                    color: p.is_followed === 1 ? "#0f1419" : "#e7e9ea",
                  }}
                >
                  {p.is_followed
                    ? t("settings.following")
                    : t("settings.follow")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      {/* Preferences */}
      <SectionHeader title={t("settings.preferences")} />

      <SettingRow label={t("settings.postLength")}>
        <View className="flex-row gap-2 mt-1">
          {(["short", "medium", "long"] as PostLength[]).map((len) => (
            <TouchableOpacity
              key={len}
              onPress={() => settings.updateSetting("postLength", len)}
              className="flex-1 py-2.5 rounded-full items-center"
              style={{
                backgroundColor:
                  settings.postLength === len ? "#1d9bf0" : "#2f3336",
              }}
              activeOpacity={0.8}
            >
              <Text
                className="text-[13px] font-bold"
                style={{
                  color:
                    settings.postLength === len ? "#ffffff" : "#71767b",
                }}
              >
                {t(`settings.${len}` as any)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SettingRow>

      <SettingRow label={t("settings.language")}>
        <View className="flex-row gap-2 mt-1">
          {(
            [
              { id: "en", label: "English" },
              { id: "pt-BR", label: "Português (BR)" },
            ] as const
          ).map((lang) => (
            <TouchableOpacity
              key={lang.id}
              onPress={() =>
                settings.updateSetting("language", lang.id as Language)
              }
              className="flex-1 py-2.5 rounded-full items-center"
              style={{
                backgroundColor:
                  settings.language === lang.id ? "#1d9bf0" : "#2f3336",
              }}
              activeOpacity={0.8}
            >
              <Text
                className="text-[13px] font-bold"
                style={{
                  color:
                    settings.language === lang.id ? "#ffffff" : "#71767b",
                }}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SettingRow>

      {/* About */}
      <SectionHeader title={t("settings.about")} />

      <View className="border-b border-border px-4 py-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-text-primary text-[15px]">
            {t("settings.version")}
          </Text>
          <Text className="text-text-secondary text-[15px]">1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleClearData}
        className="border-b border-border px-4 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-danger text-[15px] font-bold text-center">
          {t("settings.clearData")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
