import { useState } from 'react';
import { Image, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Button, Card, ErrorNotice, Heading, Screen, Badge } from '../../components/ui';
import { SignIn } from '../../components/SignIn';
import { useSession } from '../../services/session';
import { colors } from '../../constants/theme';

export default function Profile() {
  const { data, logout } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Screen
      title="Profile & Account"
      subtitle="Manage your safety preferences and family settings"
    >
      {!data ? (
        <SignIn />
      ) : (
        <>
          {/* User Profile Header Card */}
          <Card tone="default" style={styles.profileCard}>
            <View style={styles.profileHeaderRow}>
              <View style={styles.avatarContainer}>
                {data.user.photoURL ? (
                  <Image source={{ uri: data.user.photoURL }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={32} color={colors.white} />
                  </View>
                )}
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                </View>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Heading size="lg">{data.user.displayName}</Heading>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {data.family && <Badge label={data.family.name} tone="safe" />}
                </View>
                <Text style={styles.userUidText}>User ID: {data.user.id.slice(0, 16)}...</Text>
              </View>
            </View>
          </Card>

          {/* Family Info */}
          <Card tone="default">
            <Heading size="sm">Family Circle</Heading>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="people" size={18} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Family Circle</Text>
                <Text style={styles.infoValue}>{data.family ? data.family.name : 'No family circle joined'}</Text>
              </View>
              {data.family && <Badge label={`${data.members.length} Members`} tone="info" />}
            </View>
          </Card>

          {/* Privacy & Safety Policy Cards */}
          <Card tone="default">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="lock-closed" size={20} color={colors.green} />
              <Heading size="sm">GPS & Safety Privacy Policy</Heading>
            </View>
            <Body style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
              • Live location updates are transmitted only while FindMe is active.{'\n'}
              • Toggling off sharing immediately hides your coordinates from the family map.{'\n'}
              • SOS emergency signals broadcast your exact GPS coordinates to all family members until resolved.
            </Body>
          </Card>

          <ErrorNotice message={error} />

          {/* Sign Out Button */}
          <Button
            label={busy ? 'Signing out…' : 'Sign Out'}
            tone="secondary"
            icon="log-out"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await logout();
              } catch (e: any) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    padding: 20
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  avatarContainer: {
    position: 'relative'
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.cardBorder
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.white,
    borderRadius: 10
  },
  userUidText: {
    fontSize: 11,
    color: colors.mutedLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink
  }
});
