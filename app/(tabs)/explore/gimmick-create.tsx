import { Colors } from "@/constants/theme";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  createGimmickNote,
  GIMMICK_CREATE_OPTIONS,
  setupRouteForGimmick,
} from "@/data/gimmick-note-factory";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { GimmickType } from "@/types/note";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GimmickCreateScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<GimmickType>("corner");
  const [creating, setCreating] = useState(false);

  async function handleCreate(openSetup: boolean) {
    if (creating) return;
    setCreating(true);
    try {
      const note = await createGimmickNote(selectedType, title);
      if (openSetup) {
        router.replace(setupRouteForGimmick(selectedType, note.id) as never);
        return;
      }
      router.replace({
        pathname: "/note/[id]",
        params: { id: note.id },
      } as never);
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Add gimmick note" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: theme.icon }]}>
        Each gimmick note gets its own prediction table. Inputs still happen on
        Home (or on the note for tilt preview), but outcomes are isolated per
        note.
      </Text>

      <Text style={[styles.label, { color: theme.icon }]}>Title</Text>
      <TextInput
        style={[
          styles.titleInput,
          {
            color: theme.text,
            borderColor: theme.icon,
            backgroundColor: isDark ? "#1e2022" : "#fff",
          },
        ]}
        value={title}
        onChangeText={setTitle}
        placeholder="Secret Note"
        placeholderTextColor={theme.icon}
      />

      <Text style={[styles.label, { color: theme.icon }]}>Gimmick type</Text>
      {GIMMICK_CREATE_OPTIONS.map((option) => {
        const selected = selectedType === option.type;
        return (
          <Pressable
            key={option.type}
            style={[
              styles.option,
              {
                borderColor: selected ? theme.tint : theme.icon,
                backgroundColor: isDark ? "#1e2022" : "#fff",
              },
            ]}
            onPress={() => setSelectedType(option.type)}
          >
            <Text style={[styles.optionTitle, { color: theme.text }]}>
              {option.label}
            </Text>
            <Text style={[styles.optionDesc, { color: theme.icon }]}>
              {option.description}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        style={[styles.primaryButton, creating && styles.buttonDisabled]}
        onPress={() => handleCreate(false)}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Create gimmick note</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.secondaryButton, creating && styles.buttonDisabled]}
        onPress={() => handleCreate(true)}
        disabled={creating}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.tint }]}>
          Create and edit predictions
        </Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  option: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  optionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  optionDesc: { fontSize: 14, lineHeight: 20 },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#0a7ea4",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
});
