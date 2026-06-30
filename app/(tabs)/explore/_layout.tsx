import { Stack } from "expo-router";
import React from "react";

// Native headers are disabled; each screen draws its own SafeAreaView + back
// button (see ScreenHeader), matching the note detail screen. This avoids the
// nested-stack status-bar overlap.
export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
