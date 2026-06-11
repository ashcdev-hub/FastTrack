import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { useThemeStore } from "@/lib/theme-store";

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
};

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { theme } = useThemeStore();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [opacity]);

  const bgColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: bgColor,
        opacity,
        ...style,
      }}
    />
  );
}

type SkeletonCardProps = {
  children?: React.ReactNode;
};

export function SkeletonCard({ children }: SkeletonCardProps) {
  const { theme } = useThemeStore();
  return (
    <View
      className="rounded-2xl p-5 mb-3"
      style={{
        backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "#FFFFFF",
        borderWidth: 1,
        borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB",
      }}
    >
      {children}
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View>
      <SkeletonCard>
        <Skeleton width={120} height={24} />
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Skeleton height={40} />
          </View>
          <View className="flex-1">
            <Skeleton height={40} />
          </View>
          <View className="flex-1">
            <Skeleton height={40} />
          </View>
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton width={100} height={20} />
        <View className="mt-3">
          <Skeleton height={12} />
          <View className="mt-2" />
          <Skeleton height={12} />
          <View className="mt-2" />
          <Skeleton height={12} />
        </View>
      </SkeletonCard>
      <WeightChartSkeleton />
      <SkeletonCard>
        <Skeleton width={80} height={20} />
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <Skeleton height={60} />
          </View>
          <View className="flex-1">
            <Skeleton height={60} />
          </View>
          <View className="flex-1">
            <Skeleton height={60} />
          </View>
        </View>
      </SkeletonCard>
    </View>
  );
}

export function WorkoutsSkeleton() {
  return (
    <View>
      <SkeletonCard>
        <Skeleton width={140} height={20} />
        <View className="mt-3 flex-row justify-between">
          <View className="items-center">
            <Skeleton width={40} height={28} />
            <Skeleton width={60} height={12} />
          </View>
          <View className="items-center">
            <Skeleton width={40} height={28} />
            <Skeleton width={50} height={12} />
          </View>
          <View className="items-center">
            <Skeleton width={40} height={28} />
            <Skeleton width={60} height={12} />
          </View>
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton width={100} height={20} />
        <View className="mt-3">
          <Skeleton height={12} />
          <View className="mt-2" />
          <Skeleton height={40} />
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton width={100} height={20} />
        <View className="mt-3">
          <Skeleton height={12} />
          <View className="mt-2" />
          <Skeleton height={40} />
        </View>
      </SkeletonCard>
    </View>
  );
}

export function LogFoodSkeleton() {
  return (
    <View>
      <SkeletonCard>
        <Skeleton width={120} height={20} />
        <View className="mt-3 flex-row gap-2">
          <Skeleton width={80} height={40} borderRadius={12} />
          <Skeleton width={80} height={40} borderRadius={12} />
          <Skeleton width={80} height={40} borderRadius={12} />
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton width={100} height={20} />
        <View className="mt-3">
          <Skeleton height={44} borderRadius={12} />
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton width={140} height={20} />
        <View className="mt-3">
          <Skeleton height={44} borderRadius={12} />
        </View>
      </SkeletonCard>
    </View>
  );
}

export function WeightChartSkeleton() {
  return (
    <SkeletonCard>
      <Skeleton width={140} height={20} />
      <View className="mt-3">
        <Skeleton height={180} borderRadius={16} />
      </View>
      <View className="mt-4">
        <Skeleton width={60} height={32} />
        <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
      </View>
      <View className="mt-4 flex-row gap-2">
        <Skeleton height={44} borderRadius={12} />
        <Skeleton width={60} height={44} borderRadius={12} />
      </View>
    </SkeletonCard>
  );
}
