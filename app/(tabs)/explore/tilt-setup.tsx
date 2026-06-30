import { Colors } from "@/constants/theme";
import { GimmickMetaFields } from "@/components/GimmickMetaFields";
import { GimmickOutSlot } from "@/components/GimmickOutSlot";
import { RevealKindToggle } from "@/components/RevealKindToggle";
import { ScreenHeader } from "@/components/ScreenHeader";
import { defaultOutsForType } from "@/data/gimmick-note-factory";
import { getNote, updateNote } from "@/data/note-store";
import { TILT_LABELS } from "@/data/tilt-predictions-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { GimmickRevealKind, Note } from "@/types/note";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TiltSetupScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState<string[]>(["", "", "", ""]);
  const [prefix, setPrefix] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [revealKind, setRevealKind] = useState<GimmickRevealKind>("text");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

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
          outs && outs.length === 4 ? [...outs] : defaultOutsForType("tilt"),
        );
        setPrefix(found?.gimmickConfig?.outPrefix ?? "");
        setDateStr(found?.date ?? "");
        setRevealKind(found?.gimmickConfig?.revealKind ?? "text");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [noteId]);

  // Refresh on focus so drawings authored in the editor show as thumbnails.
  useEffect(() => {
    if (!isFocused || !noteId) return;
    let active = true;
    (async () => {
      const found = await getNote(noteId);
      if (active && found) setNote(found);
    })();
    return () => {
      active = false;
    };
  }, [isFocused, noteId]);

  function updateSlot(index: number, text: string) {
    setDraft((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
    setSaved(false);
  }

  async function changeRevealKind(kind: GimmickRevealKind) {
    setRevealKind(kind);
    setSaved(false);
    if (!note) return;
    const updated = await updateNote(note.id, {
      gimmickConfig: { outs: [], ...note.gimmickConfig, revealKind: kind },
    });
    if (updated) setNote(updated);
  }

  async function handleSave() {
    if (!note) return;
    await updateNote(note.id, {
      date: dateStr.trim() || note.date,
      gimmickConfig: {
        ...note.gimmickConfig,
        outs: draft,
        outPrefix: prefix,
        revealKind,
      },
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
      <ScreenHeader title="Tilt Setup" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Outs for {note.title}. Edit each face-down flip outcome.
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

      <RevealKindToggle value={revealKind} onChange={changeRevealKind} />

      {TILT_LABELS.map((label, index) => (
        <GimmickOutSlot
          key={label}
          noteId={note.id}
          index={index}
          label={`${label} (slot ${index + 1})`}
          value={draft[index]}
          placeholder={`Prediction for ${label.toLowerCase()}`}
          onChangeText={(text) => updateSlot(index, text)}
          revealKind={revealKind}
          drawing={note.gimmickConfig?.drawingOuts?.[index]}
        />
      ))}

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save predictions</Text>
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
