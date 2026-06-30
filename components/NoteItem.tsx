import { useSecretCorner } from "@/context/SecretCornerContext";
import type { Note } from "@/types/note";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Single note row used on the Home list screen
export function NoteItem({ note }: { note: Note }) {
  const router = useRouter();
  const { armRoutine } = useSecretCorner();

  // 0 = resting, 1 = pressed. Drives a quick scale-down + highlight tint.
  const press = useRef(new Animated.Value(0)).current;

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });

  const highlightOpacity = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  function animateTo(value: number) {
    Animated.spring(press, {
      toValue: value,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  }

  // Short body preview. Gimmick notes show their prefix as a cover (so the
  // instructional/reveal text never leaks); empty prefix falls back to "...".
  const maxChars = 20;
  const coverSource = note.isGimmicked
    ? note.gimmickConfig?.outPrefix ?? ""
    : note.content;
  const raw = coverSource.trim();
  const snippet = raw.length > maxChars ? raw.slice(0, maxChars) : raw;

  // Hidden maneuver: long-press a gimmick row to arm it for index inputs.
  function handleLongPress() {
    if (!note.isGimmicked) return;
    armRoutine(note.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  return (
    <AnimatedPressable
      className="w-full h-18 bg-white p-4 rounded-lg mb-3 flex-row justify-between items-center shadow"
      style={{ transform: [{ scale }] }}
      onPress={() => router.push(`/note/${note.id}` as never)}
      onLongPress={handleLongPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      delayLongPress={500}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.highlight, { opacity: highlightOpacity }]}
      />
      <View>
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.preview} numberOfLines={2} ellipsizeMode="tail">
          {snippet}...
        </Text>
      </View>
      <Text style={styles.date}>{note.date}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  highlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  preview: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    maxWidth: "100%",
  },
});

