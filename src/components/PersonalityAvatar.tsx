import React from "react";
import { View, Text } from "react-native";

interface PersonalityAvatarProps {
  emoji: string;
  name?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { container: "w-10 h-10", emoji: "text-lg" },
  md: { container: "w-12 h-12", emoji: "text-xl" },
  lg: { container: "w-14 h-14", emoji: "text-2xl" },
};

export default function PersonalityAvatar({
  emoji,
  size = "md",
}: PersonalityAvatarProps) {
  const s = sizes[size];
  return (
    <View
      className={`${s.container} rounded-full bg-background items-center justify-center`}
      style={{ backgroundColor: "#16181c" }}
    >
      <Text className={s.emoji}>{emoji}</Text>
    </View>
  );
}
