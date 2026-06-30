import { Colors } from "@/constants/theme";
import { GimmickMetaFields } from "@/components/GimmickMetaFields";
import { ScreenHeader } from "@/components/ScreenHeader";
import { defaultOutsForType } from "@/data/gimmick-note-factory";
import { getNote, updateNote } from "@/data/note-store";
import { CORNER_LABELS } from "@/data/predictions-store";
import { TILT_LABELS } from "@/data/tilt-predictions-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Note } from "@/types/note";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ComboSetupScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState<string[]>(Array(16).fill(""));
  const [prefix, setPrefix] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  useEffect(() => {
    if (!noteId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const found = await getNote(noteId);
      if (active) {
        setNote(found);
        const outs = found?.gimmickConfig?.outs;
        setDraft(
          outs && outs.length === 16
            ? [...outs]
            : defaultOutsForType("tilt-corner"),
        );
        setPrefix(found?.gimmickConfig?.outPrefix ?? "");
        setDateStr(found?.date ?? "");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [noteId]);

  function updateSlot(index: number, text: string) {
    setDraft((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    if (!note) return;
    await updateNote(note.id, {
      date: dateStr.trim() || note.date,
      gimmickConfig: { ...note.gimmickConfig, outs: draft, outPrefix: prefix },
    });
    setSaved(true);
  }

  if (loading) {
    return (
      <View style={[styles.loaderWrap, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.loaderWrap, { backgroundColor: theme.background }]}>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Routine not found.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Tilt + Corner Combo" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Outs for {note.title}. 4 categories x 4 items (16 combos). Flip on
          Home, then tap a corner.
        </Text>

      <GimmickMetaFields
        prefix={prefix}
        onPrefixChange={(t) => {
          setPrefix(t);
          setSaved(false);
        }}
        date={dateStr}
        onDateChange={(t) => {
          setDateStr(t);
          setSaved(false);
        }}
      />

      {TILT_LABELS.map((tiltLabel, tiltIndex) => (
        <View key={tiltLabel} style={styles.group}>
          <Text style={[styles.groupTitle, { color: theme.text }]}>
            Category {tiltIndex + 1}: {tiltLabel}
          </Text>

          {CORNER_LABELS.map((cornerLabel, cornerIndex) => {
            const comboIndex = tiltIndex * 4 + cornerIndex;
            return (
              <View key={`${tiltLabel}-${cornerLabel}`} style={styles.field}>
                <Text style={[styles.label, { color: theme.icon }]}>
                  {cornerLabel} (item {cornerIndex + 1}, slot {comboIndex + 1})
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.icon,
                      backgroundColor: colorScheme === "dark" ? "#1e2022" : "#fff",
                    },
                  ]}
                  value={draft[comboIndex]}
                  onChangeText={(text) => updateSlot(comboIndex, text)}
                  placeholder={`Prediction for category ${tiltIndex + 1}, item ${cornerIndex + 1}`}
                  placeholderTextColor={theme.icon}
                  multiline
                />
              </View>
            );
          })}
        </View>
      ))}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save combo predictions</Text>
        </Pressable>

        {saved ? (
          <Text style={[styles.savedHint, { color: theme.tint }]}>Saved!</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  group: {
    marginBottom: 18,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.25)",
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 72,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#0a7ea4",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  savedHint: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
});
