import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import { GlassPanel } from "@/components/GlassPanel";

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
  const c = getThemeColors(theme);
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value * (typeof width === "number" ? width : 100) }],
  }));

  return (
    <View style={{ width, height, borderRadius, backgroundColor: c.cardBgAlt, overflow: "hidden", ...style }}>
      <Animated.View
        style={[
          {
            width: "40%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

type SkeletonCardProps = {
  children?: React.ReactNode;
};

export function SkeletonCard({ children }: SkeletonCardProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  return (
    <GlassPanel className=" p-5 mb-3">
      {children}
    </GlassPanel>
  );
}

export function ProfileSkeleton() {
  return (
    <View>
      <SkeletonCard>
        <Skeleton width={120} height={24} />
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1"><Skeleton height={40} /></View>
          <View className="flex-1"><Skeleton height={40} /></View>
          <View className="flex-1"><Skeleton height={40} /></View>
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
          <View className="flex-1"><Skeleton height={60} /></View>
          <View className="flex-1"><Skeleton height={60} /></View>
          <View className="flex-1"><Skeleton height={60} /></View>
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
