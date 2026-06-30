import { buildPathData, strokeWidthPx } from "@/lib/drawing/path";
import type { Drawing } from "@/types/note";
import React, { useState } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  drawing?: Drawing | null;
  /** Override every stroke's color (useful for theming/cover states). */
  color?: string;
  style?: ViewStyle | ViewStyle[];
};

/** Read-only renderer for a normalized Drawing. Scales to fill its container. */
export function DrawingView({ drawing, color, style }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={style}
      onLayout={(e) =>
        setSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
      {size.width > 0 && drawing ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
        >
          {drawing.strokes.map((stroke, i) => (
            <Path
              key={i}
              d={buildPathData(
                stroke.points,
                size.width,
                size.height,
                drawing.aspect,
              )}
              stroke={color ?? stroke.color ?? "#11181C"}
              strokeWidth={strokeWidthPx(
                stroke.width,
                size.width,
                size.height,
                drawing.aspect,
              )}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
