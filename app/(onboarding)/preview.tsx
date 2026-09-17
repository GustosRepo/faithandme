import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, EditorialLabel, Screen, Text } from '@/components/ui';

export default function PreviewScreen() {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={styles.container}>
      <EditorialLabel>Step 5 of 6</EditorialLabel>
      <Text variant="displaySerif">Keep His Word close.</Text>
      <Text variant="body" style={styles.subtleText}>Your daily Scripture can meet you right where you already are.</Text>

      <Card style={styles.widgetShell}>
        <View style={styles.widgetPreview}>
          <Text variant="scripture" style={styles.widgetVerse}>“Be still, and know that I am God.”</Text>
          <Text variant="scriptureReference" style={styles.widgetReference}>Psalm 46:10</Text>
          <Text variant="bodySmall" style={styles.widgetBrand}>Faith & Me</Text>
        </View>
      </Card>

      <Text variant="bodySmall" style={styles.subtleText}>One daily Scripture widget will always be free.</Text>

      <View style={styles.footer}>
        <Button title="Continue" onPress={() => router.push('/(onboarding)/ready')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 18,
  },
  subtleText: {
    maxWidth: 300,
  },
  widgetShell: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  widgetPreview: {
    padding: 22,
    minHeight: 220,
    justifyContent: 'space-between',
    backgroundColor: '#F7F2EA',
  },
  widgetVerse: {
    fontSize: 26,
    lineHeight: 36,
    marginBottom: 8,
    color: '#1E1D1A',
  },
  widgetReference: {
    color: '#4E4945',
    marginTop: 8,
  },
  widgetBrand: {
    alignSelf: 'flex-end',
    color: '#596B4D',
    marginTop: 18,
  },
  footer: {
    marginTop: 12,
  },
});
