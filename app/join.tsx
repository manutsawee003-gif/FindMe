import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Button, Card, ErrorNotice, Heading, Loading, Screen, Badge } from '../components/ui';
import { SignIn } from '../components/SignIn';
import { api, pendingInvite } from '../services/api';
import { useSession } from '../services/session';
import { colors } from '../constants/theme';

export default function Join() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { data, refresh } = useSession();
  const [family, setFamily] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Invitation code missing. Please verify your link or code.');
      return;
    }
    pendingInvite.set(code);
    if (data) {
      api<{ name: string }>('/family/preview', { code })
        .then(result => setFamily(result.name))
        .catch(e => setError(e.message));
    }
  }, [code, !data]);

  return (
    <Screen
      title="Family Invitation"
      subtitle="Review family circle details before confirming to join"
    >
      <ErrorNotice message={error} />
      {!data ? (
        <SignIn />
      ) : family ? (
        <Card tone="safe" style={styles.joinCard}>
          <View style={styles.joinIconBox}>
            <Ionicons name="people" size={36} color={colors.green} />
          </View>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Badge label="INVITATION RECEIVED" tone="safe" />
            <Heading size="lg">Join "{family}"</Heading>
            <Body style={{ textAlign: 'center', fontSize: 13, color: colors.muted }}>
              Family members will see your profile name and receive your emergency SOS alerts when triggered.
              Continuous location tracking is only active when you turn on GPS sharing.
            </Body>
          </View>

          <View style={{ gap: 10, width: '100%', marginTop: 8 }}>
            <Button
              disabled={busy}
              tone="primary"
              size="lg"
              icon="checkmark-circle"
              label={busy ? 'Joining family…' : `Confirm & Join ${family}`}
              onPress={async () => {
                setBusy(true);
                try {
                  await api('/family/join', { code });
                  await pendingInvite.clear();
                  await refresh();
                  router.replace('/family');
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            />

            <Button
              label="Cancel"
              tone="outline"
              size="sm"
              onPress={() => {
                pendingInvite.clear();
                router.replace('/family');
              }}
            />
          </View>
        </Card>
      ) : !error ? (
        <Card>
          <Loading label="Verifying invitation code…" />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  joinCard: {
    padding: 24,
    alignItems: 'center',
    gap: 16
  },
  joinIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.greenBorder,
    shadowColor: colors.green,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  }
});

