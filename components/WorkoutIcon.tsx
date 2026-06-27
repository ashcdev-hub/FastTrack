import React from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { getSvgBody } from "@/lib/exercise-icons";

type WorkoutIconProps = {
  name: string;
  size?: number;
  color?: string;
};

export function WorkoutIcon({ name, size = 24, color = "#c3f400" }: WorkoutIconProps) {
  const body = getSvgBody(name) ?? getSvgBody("dumbbell");
  if (!body) return null;

  const colorKey = "currentColor";
  const colored = body.split(colorKey).join(color);
  const isStroke = colored.includes('stroke="currentColor"') || colored.includes("stroke=");
  const fill = isStroke ? "none" : color;
  const stroke = isStroke ? color : "none";

  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}">${colored}</svg>`;

  return (
    <View style={{ width: size, height: size }}>
      <SvgXml xml={svgMarkup} width={size} height={size} />
    </View>
  );
}
