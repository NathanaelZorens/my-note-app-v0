import { AddButton } from "@/components/AddButton";
import { NoteItem } from "@/components/NoteItem";
import { useSecretCorner } from "@/context/SecretCornerContext";
import { createNote, loadNotes } from "@/data/note-store";
import type { Note } from "@/types/note";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

// Invisible corner hit-area size (padding so list doesn't overlap corners)
const CORNER_SIZE = 56;

// Main Screen: list + 4 invisible corner "secret" zones (UpL=1, UpR=2, DownL=3, DownR=4)
export default function NoteListScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const { setCornerIndex } = useSecretCorner();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const fresh = await loadNotes();
        if (isActive) {
          setNotes(fresh);
        }
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const renderItem = ({ item }: { item: Note }) => <NoteItem note={item} />;

  async function handleAddDummyNote() {
    const newNote = await createNote({
      title: "New Note",
      content: "",
      isGimmicked: false,
    });

    const fresh = await loadNotes();
    setNotes(fresh);

    router.push(`/note/${newNote.id}` as never);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View className="items-center flex-col m-4">
        <Text style={styles.header}>My Notes</Text>
        <AddButton onPress={handleAddDummyNote} />
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
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
  },
});
