import { Stack } from "expo-router";
import React from "react";

// No bottom tab bar: the app is just Home + note detail on the surface, and the
// gimmick settings (explore/*) are reached only via hidden maneuvers.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
