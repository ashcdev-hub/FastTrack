import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type ProgressRingProps = {
  size?: number;
  strokeWidth?: number;
  progress: number;
  trackColor?: string;
  indicatorColor?: string;
  children?: React.ReactNode;
};

export function ProgressRing({
  size = 48,
  strokeWidth = 6,
  progress,
  trackColor = "rgba(255,255,255,0.1)",
  indicatorColor = "#c3f400",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <View className="relative items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={indicatorColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="square"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children && (
        <View className="absolute inset-0 items-center justify-center">
          {children}
        </View>
      )}
    </View>
  );
}
