import { NoteItem } from "@/components/NoteItem";
import { useSecretCorner } from "@/context/SecretCornerContext";
import { createNote, loadNotes } from "@/data/note-store";
import { useTiltDetector } from "@/hooks/use-tilt-detector";
import type { Note } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import * as Brightness from "expo-brightness";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import "../../global.css";

const CORNER_SIZE = 56;
/** Hold the edge tab this long to drop into blackout. */
const BLACKOUT_ENTER_MS = 700;
/** Max gap between the two taps that wake the screen back up. */
const DOUBLE_TAP_MS = 300;
/**
 * Backlight level during blackout. Must stay > 0: a literal 0 makes some
 * Android panels power off, which suspends JS + the accelerometer and kills
 * tilt. The black overlay does the visual hiding; this just kills the glow.
 */
const BLACKOUT_BRIGHTNESS = 0.01;
/**
 * Keep false. Lowering the backlight makes some panels power down, which
 * suspends JS + the accelerometer and stops tilt while "off". The black overlay
 * already hides the UI, so we leave brightness alone. Only flip this on if you
 * confirm a device dims without killing tilt (e.g. true-black OLED).
 */
const DIM_DURING_BLACKOUT = false;

export default function NoteListScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [blackout, setBlackout] = useState(false);
  const prevBrightness = useRef<number | null>(null);
  const lastBlackoutTap = useRef<number>(0);
  // Updated by the tilt detector; true while the screen faces up. Gates the
  // wake double-tap so a face-down phone in someone's hand can't be woken.
  const faceUpRef = useRef(true);
  const { recordCornerTap, setTiltIndex } = useSecretCorner();
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const handleFaceUpChange = useCallback((up: boolean) => {
    faceUpRef.current = up;
  }, []);

  // Tilt keeps listening through blackout: the screen never truly sleeps
  // (keep-awake) and Home stays focused under the overlay, so a face-down
  // flip still registers for the armed routine while the screen looks "off".
  const { calibrateFaceUp } = useTiltDetector(
    setTiltIndex,
    isFocused,
    handleFaceUpChange,
  );

  async function enterBlackout() {
    // You trigger fake-off while looking at the screen, so this is a reliable
    // moment to calibrate which way is "face up" for the wake gate.
    calibrateFaceUp();
    setBlackout(true);
    try {
      await activateKeepAwakeAsync("blackout");
    } catch {}
    if (DIM_DURING_BLACKOUT) {
      try {
        prevBrightness.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(BLACKOUT_BRIGHTNESS);
      } catch {}
    }
    if (Platform.OS === "android") {
      try {
        await NavigationBar.setVisibilityAsync("hidden");
      } catch {}
    }
  }

  async function exitBlackout() {
    if (Platform.OS === "android") {
      try {
        await NavigationBar.setVisibilityAsync("visible");
      } catch {}
    }
    if (DIM_DURING_BLACKOUT) {
      try {
        if (prevBrightness.current != null) {
          await Brightness.setBrightnessAsync(prevBrightness.current);
        }
      } catch {}
    }
    try {
      deactivateKeepAwake("blackout");
    } catch {}
    setBlackout(false);
  }

  // Wake on a double-tap anywhere on the black overlay; single taps are
  // swallowed so a spectator's stray touch never lights it up. Ignored
  // entirely unless the screen is face up, so handling a face-down phone
  // can't accidentally wake it.
  function handleBlackoutTap() {
    if (!faceUpRef.current) {
      lastBlackoutTap.current = 0;
      return;
    }
    const now = Date.now();
    if (now - lastBlackoutTap.current < DOUBLE_TAP_MS) {
      lastBlackoutTap.current = 0;
      exitBlackout();
    } else {
      lastBlackoutTap.current = now;
    }
  }

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

  async function handleAddNote() {
    const newNote = await createNote({
      title: "New Note",
      content: "",
      isGimmicked: false,
    });

    const fresh = await loadNotes();
    setNotes(fresh);

    router.push({
      pathname: "/note/[id]",
      params: { id: newNote.id, focus: "1" },
    } as never);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>QuiNotes</Text>
          </View>

          <FlatList
            style={styles.list}
            data={notes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No notes found. Start adding some!
              </Text>
            }
          />
        </View>

        <Pressable
          style={[styles.corner, styles.cornerTopLeft, { top: insets.top }]}
          onPress={() => recordCornerTap(0)}
        />
        <Pressable
          style={[styles.corner, styles.cornerTopRight, { top: insets.top }]}
          onPress={() => recordCornerTap(1)}
        />
        <Pressable
          style={[
            styles.corner,
            styles.cornerBottomLeft,
            { bottom: insets.bottom },
          ]}
          onPress={() => recordCornerTap(2)}
        />
        <Pressable
          style={[
            styles.corner,
            styles.cornerBottomRight,
            { bottom: insets.bottom },
          ]}
          onPress={() => recordCornerTap(3)}
        />

        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 14 }]}
          onPress={handleAddNote}
          onLongPress={() => router.push("/explore/gimmick-create" as never)}
          delayLongPress={500}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      </SafeAreaView>

      {/* Fake screen-off: an opaque layer that hides the UI and swallows every
          touch, so a spectator handling the phone can't trip the corners or
          buttons. The app stays foregrounded, so tilt keeps listening.
          Double-tap anywhere on it to wake back up. */}
      {blackout ? (
        <Pressable style={styles.blackout} onPress={handleBlackoutTap} />
      ) : (
        /* Invisible tab on the right edge (only while lit). Hold to go dark. */
        <Pressable
          style={styles.edgeTab}
          onLongPress={enterBlackout}
          delayLongPress={BLACKOUT_ENTER_MS}
        />
      )}

      <StatusBar hidden={blackout} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  blackout: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 10,
  },
  edgeTab: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -70,
    width: 50,
    height: 140,
    zIndex: 20,
    // backgroundColor: "rgba(255, 0, 0, 0.5)", // uncomment to test placement
  },
  content: {
    flex: 1,
    // Header sits up in the top-corner band (no wasted gap). Bottom padding is
    // applied dynamically (insets + corner zone) so the list clears the FAB.
    // No horizontal padding here: the FlatList spans full width so its
    // scrollbar hugs the screen edge — the rows are inset via listContent.
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  header: {
    fontSize: 28,
    fontFamily: "PlaywriteAUTAS_400Regular",
    color: "#333",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    // Inset the rows (not the scrollbar) so boxes keep their position.
    paddingHorizontal: 16,
  },
  fab: {
    position: "absolute",
    left: "50%",
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    // TODO: testing only — remove to make corners invisible again
    // backgroundColor: "rgba(255, 0, 0, 0.5)",
  },
  cornerTopLeft: { left: 0 },
  cornerTopRight: { right: 0 },
  cornerBottomLeft: { left: 0 },
  cornerBottomRight: { right: 0 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
  },
});
