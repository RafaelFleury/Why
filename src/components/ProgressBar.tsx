import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "@/utils/i18n";

interface ProgressBarProps {
  level: number; // 1-5
  label?: string;
  showLabel?: boolean;
}

export default function ProgressBar({
  level,
  label,
  showLabel = true,
}: ProgressBarProps) {
  const { t } = useTranslation();
  const percentage = (level / 5) * 100;

  const difficultyKey = `difficulty.${level}` as
    | "difficulty.1"
    | "difficulty.2"
    | "difficulty.3"
    | "difficulty.4"
    | "difficulty.5";
  const diffLabel = label ?? t(difficultyKey);

  return (
    <View>
      {showLabel && (
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-text-secondary">{diffLabel}</Text>
          <Text className="text-xs text-text-muted">{level}/5</Text>
        </View>
      )}
      <View
        className="h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "#2f3336" }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: "#1d9bf0",
          }}
        />
      </View>
    </View>
  );
}
