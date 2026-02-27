import { Stack } from 'expo-router';

export default function NoteLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Note', headerShown: true }} />
    </Stack>
  );
}
