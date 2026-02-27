import type { Note } from "@/types/note";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Single note row used on the Home list screen
export function NoteItem({ note }: { note: Note }) {
  const router = useRouter();

  // Short body preview
  const maxChars = 20;
  const raw = note.content.trim();
  const snippet = raw.length > maxChars ? raw.slice(0, maxChars) : raw;

  return (
    <Pressable
      className="w-full h-18 bg-white p-4 rounded-lg mb-3 flex-row justify-between items-center shadow"
      onPress={() => router.push(`/note/${note.id}` as never)}
    >
      <View>
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.preview} numberOfLines={2} ellipsizeMode="tail">
          {snippet}...
        </Text>
      </View>
      <Text style={styles.date}>{note.date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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

