import { useSecretCorner } from "@/context/SecretCornerContext";
import { DUMMY_NOTES } from "@/data/dummy-notes";
import type { Note } from "@/types/note";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

// Invisible corner hit-area size (padding so list doesn't overlap corners)
const CORNER_SIZE = 56;

// Component for a single note item (tappable → opens detail)
const NoteItem = ({ note }: { note: Note }) => {
  const router = useRouter();
  return (
    <Pressable
      className="w-full h-16 bg-white p-4 rounded-lg mb-3 flex-row justify-between items-center shadow"
      onPress={() => router.push(`/note/${note.id}` as never)}
    >
      <Text style={styles.title}>{note.title}</Text>
      <Text style={styles.date}>{note.date}</Text>
    </Pressable>
  );
};

// Main Screen: list + 4 invisible corner "secret" zones (UpL=1, UpR=2, DownL=3, DownR=4)
export default function NoteListScreen() {
  const [notes, setNotes] = useState<Note[]>(DUMMY_NOTES);
  const { setCornerIndex } = useSecretCorner();

  const renderItem = ({ item }: { item: Note }) => <NoteItem note={item} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View className="items-center flex-col m-4">
        <Text style={styles.header}>My Notes</Text>
        <FlatList
          data={notes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No notes found. Start adding some!
            </Text>
          }
        />
      </View>

      <Pressable
        style={[styles.corner, styles.cornerTopLeft]}
        onPress={() => setCornerIndex(0)}
      />
      <Pressable
        style={[styles.corner, styles.cornerTopRight]}
        onPress={() => setCornerIndex(1)}
      />
      <Pressable
        style={[styles.corner, styles.cornerBottomLeft]}
        onPress={() => setCornerIndex(2)}
      />
      <Pressable
        style={[styles.corner, styles.cornerBottomRight]}
        onPress={() => setCornerIndex(3)}
      />
    </SafeAreaView>
  );
}

// 4. Stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    paddingTop: CORNER_SIZE,
    paddingBottom: CORNER_SIZE,
    paddingLeft: CORNER_SIZE,
    paddingRight: CORNER_SIZE,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    // Invisible but touchable
  },
  cornerTopLeft: { top: 0, left: 0 },
  cornerTopRight: { top: 0, right: 0 },
  cornerBottomLeft: { bottom: 0, left: 0 },
  cornerBottomRight: { bottom: 0, right: 0 },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
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
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
  },
});
