import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * In-screen header with a back button, mirroring the note detail screen.
 * Used instead of the native stack header (which mis-positions when nested
 * inside another headerless stack).
 */
export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={theme.tint} />
        <Text style={[styles.backText, { color: theme.tint }]}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 4,
  },
});
