import React from "react";
import { View, Text } from "react-native";
import type { Reply as ReplyType } from "@/types";
import PersonalityAvatar from "./PersonalityAvatar";

interface ReplyProps {
  reply: ReplyType;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString();
}

function nameToHandle(name: string): string {
  return "@" + name.toLowerCase().replace(/[\s.]+/g, "_");
}

export default function Reply({ reply }: ReplyProps) {
  const displayName = reply.isUserQuestion
    ? "You"
    : reply.personality?.name ?? "AI";
  const handle = reply.isUserQuestion
    ? "@you"
    : nameToHandle(reply.personality?.name ?? "AI");

  return (
    <View className="border-b border-border px-4 py-3">
      <View className="flex-row">
        {/* Avatar */}
        <View className="mr-3 pt-0.5">
          <PersonalityAvatar
            emoji={
              reply.isUserQuestion
                ? "👤"
                : reply.personality?.avatarEmoji ?? "🤖"
            }
            size="sm"
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center mb-0.5">
            <Text className="text-text-primary font-bold text-[15px]">
              {displayName}
            </Text>
            <Text className="text-text-secondary text-[14px] ml-1">
              {handle}
            </Text>
            <Text className="text-text-secondary text-[14px] mx-1">
              ·
            </Text>
            <Text className="text-text-secondary text-[14px]">
              {formatTimestamp(reply.createdAt)}
            </Text>
          </View>

          {/* Reply content */}
          <Text className="text-text-primary text-[15px] leading-[21px]">
            {reply.content}
          </Text>
        </View>
      </View>
    </View>
  );
}
