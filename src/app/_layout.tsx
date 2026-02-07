import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUserProgressStore } from "@/stores/userProgressStore";
import { seedPersonalities } from "@/utils/personalities";
import { getDatabase } from "@/services/database";
import { useTranslation } from "@/utils/i18n";
import "../../global.css";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadTopics = useUserProgressStore((s) => s.loadTopics);
  const { t } = useTranslation();

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await seedPersonalities();
        await loadSettings();
        await loadTopics();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#1d9bf0" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: "#000000",
            borderBottomWidth: 0.5,
            borderBottomColor: "#2f3336",
          } as any,
          headerTintColor: "#e7e9ea",
          headerTitleStyle: { fontWeight: "700", fontSize: 18 },
          tabBarStyle: {
            backgroundColor: "#000000",
            borderTopColor: "#2f3336",
            borderTopWidth: 0.5,
            height: 50,
            paddingBottom: 0,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#e7e9ea",
          tabBarInactiveTintColor: "#536471",
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            headerTitle: () => (
              <Text style={{ color: "#e7e9ea", fontWeight: "800", fontSize: 20 }}>
                Why
              </Text>
            ),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: t("nav.bookmarks"),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "bookmark" : "bookmark-outline"}
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="recap"
          options={{
            title: t("nav.recap"),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "bar-chart" : "bar-chart-outline"}
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("nav.settings"),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="post/[id]"
          options={{
            href: null,
            title: "",
            headerStyle: {
              backgroundColor: "#000000",
            },
            headerTintColor: "#e7e9ea",
          }}
        />
      </Tabs>
    </>
  );
}
