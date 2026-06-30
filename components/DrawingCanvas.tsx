import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  buildPathData,
  strokeWidthPx,
} from "@/lib/drawing/path";
import type { Drawing, DrawingPoint } from "@/types/note";
import React, { useRef, useState } from "react";
import { PanResponder, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  value: Drawing;
  onChange: (next: Drawing) => void;
  color?: string;
  /** Stroke width as a fraction of box width (defaults to DEFAULT_STROKE_WIDTH). */
  strokeWidth?: number;
  style?: ViewStyle | ViewStyle[];
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Editable drawing surface. Captures finger strokes as normalized points. */
export function DrawingCanvas({
  value,
  onChange,
  color = DEFAULT_STROKE_COLOR,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  style,
}: Props) {
  const size = useRef({ width: 1, height: 1 });
  const current = useRef<DrawingPoint[]>([]);
  const [liveStroke, setLiveStroke] = useState<DrawingPoint[]>([]);

  // Latest props kept in refs so the PanResponder (created once) stays current.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const styleRef = useRef({ color, strokeWidth });
  styleRef.current = { color, strokeWidth };

  const addPoint = (locationX: number, locationY: number) => {
    const { width, height } = size.current;
    current.current.push({
      x: clamp01(locationX / width),
      y: clamp01(locationY / height),
    });
    setLiveStroke([...current.current]);
  };

  const endStroke = () => {
    if (current.current.length > 0) {
      const stroke = {
        points: current.current,
        color: styleRef.current.color,
        width: styleRef.current.strokeWidth,
      };
      const { width, height } = size.current;
      onChangeRef.current({
        strokes: [...valueRef.current.strokes, stroke],
        aspect: height > 0 ? width / height : valueRef.current.aspect,
      });
    }
    current.current = [];
    setLiveStroke([]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        current.current = [];
        addPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderMove: (e) => {
        addPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderRelease: endStroke,
      onPanResponderTerminate: endStroke,
    }),
  ).current;

  const { width, height } = size.current;

  return (
    <View
      style={style}
      onLayout={(e) => {
        size.current = {
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        };
      }}
      {...panResponder.panHandlers}
    >
      <Svg style={StyleSheet.absoluteFill}>
        {value.strokes.map((stroke, i) => (
          <Path
            key={i}
            d={buildPathData(stroke.points, width, height, value.aspect)}
            stroke={stroke.color ?? DEFAULT_STROKE_COLOR}
            strokeWidth={strokeWidthPx(stroke.width, width, height, value.aspect)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {liveStroke.length > 0 ? (
          <Path
            d={buildPathData(liveStroke, width, height)}
            stroke={color}
            strokeWidth={strokeWidthPx(strokeWidth, width, height)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}
