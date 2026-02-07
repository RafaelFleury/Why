import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export default function PostSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View className="border-b border-border px-4 py-3">
      <View className="flex-row">
        {/* Avatar */}
        <Animated.View
          style={{ opacity }}
          className="w-10 h-10 rounded-full mr-3"
          // @ts-ignore
          accessibilityRole="none"
        >
          <View className="w-10 h-10 rounded-full" style={{ backgroundColor: "#2f3336" }} />
        </Animated.View>

        {/* Content */}
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center mb-2">
            <Animated.View
              style={{ opacity }}
              className="h-3.5 rounded"
            >
              <View className="w-20 h-3.5 rounded" style={{ backgroundColor: "#2f3336" }} />
            </Animated.View>
            <Animated.View
              style={{ opacity }}
              className="ml-2 h-3 rounded"
            >
              <View className="w-16 h-3 rounded" style={{ backgroundColor: "#2f3336" }} />
            </Animated.View>
          </View>

          {/* Content lines */}
          <Animated.View style={{ opacity }}>
            <View className="h-3.5 rounded mb-2" style={{ backgroundColor: "#2f3336", width: "100%" }} />
          </Animated.View>
          <Animated.View style={{ opacity }}>
            <View className="h-3.5 rounded mb-2" style={{ backgroundColor: "#2f3336", width: "90%" }} />
          </Animated.View>
          <Animated.View style={{ opacity }}>
            <View className="h-3.5 rounded mb-4" style={{ backgroundColor: "#2f3336", width: "70%" }} />
          </Animated.View>

          {/* Actions */}
          <View className="flex-row justify-between mt-1 mb-1">
            <Animated.View style={{ opacity }}>
              <View className="w-8 h-4 rounded" style={{ backgroundColor: "#2f3336" }} />
            </Animated.View>
            <Animated.View style={{ opacity }}>
              <View className="w-8 h-4 rounded" style={{ backgroundColor: "#2f3336" }} />
            </Animated.View>
            <Animated.View style={{ opacity }}>
              <View className="w-8 h-4 rounded" style={{ backgroundColor: "#2f3336" }} />
            </Animated.View>
            <Animated.View style={{ opacity }}>
              <View className="w-8 h-4 rounded" style={{ backgroundColor: "#2f3336" }} />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}
