import { GimmickMetaFields } from "@/components/GimmickMetaFields";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/theme";
import {
  CARD_RANKS,
  CARD_SUITS,
  defaultCardOuts,
} from "@/data/gimmick-note-factory";
import { getNote, updateNote } from "@/data/note-store";
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

// Short corner codes for the two-tap rank hint (matches Home corner indices).
const CORNER_CODES = ["TL", "TR", "BL", "BR"] as const;

/** The two-tap code for a rank: first tap = floor(r / 4), second = r % 4. */
function rankTapHint(rank: number): string {
  return `${CORNER_CODES[Math.floor(rank / 4)]}, ${CORNER_CODES[rank % 4]}`;
}

export default function CardSetupScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState<string[]>(() => defaultCardOuts());
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
        setDraft(outs && outs.length === 52 ? [...outs] : defaultCardOuts());
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
      <ScreenHeader title="Card Index (52)" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Flip for the suit, then tap two corners for the rank
          (first = row, second = column). Rank value = first × 4 + second + 1.
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

        {CARD_SUITS.map((suit, suitIndex) => (
          <View key={suit} style={styles.group}>
            <Text style={[styles.groupTitle, { color: theme.text }]}>
              Suit {suitIndex + 1}: {suit}
            </Text>
            <Text style={[styles.groupHint, { color: theme.icon }]}>
              Flip: {TILT_LABELS[suitIndex]}
            </Text>

            {CARD_RANKS.map((rank, rankIndex) => {
              const slot = suitIndex * 13 + rankIndex;
              return (
                <View key={`${suit}-${rank}`} style={styles.field}>
                  <Text style={[styles.label, { color: theme.icon }]}>
                    {rank} — tap {rankTapHint(rankIndex)}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.icon,
                        backgroundColor:
                          colorScheme === "dark" ? "#1e2022" : "#fff",
                      },
                    ]}
                    value={draft[slot]}
                    onChangeText={(text) => updateSlot(slot, text)}
                    placeholder={`${rank} of ${suit}`}
                    placeholderTextColor={theme.icon}
                    multiline
                  />
                </View>
              );
            })}
          </View>
        ))}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save deck</Text>
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
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  groupHint: {
    fontSize: 12,
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
    minHeight: 48,
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
