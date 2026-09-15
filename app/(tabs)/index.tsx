import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Button, Card, ErrorNotice, Heading, Screen, Badge, EmergencyHotlinesWidget } from '../../components/ui';
import { SignIn } from '../../components/SignIn';
import { useSession } from '../../services/session';
import { colors } from '../../constants/theme';

export default function Home() {
  const { data, error, sharing, share } = useSession();
  const [selectedQuickType, setSelectedQuickType] = useState<string | null>(null);

  const emergencyQuickTypes = [
    { type: 'Flood', label: 'Flood', icon: 'water' as const, color: colors.blue, bg: colors.blueSoft },
    { type: 'Trapped', label: 'Trapped', icon: 'warning' as const, color: colors.amber, bg: colors.amberSoft },
    { type: 'Medical', label: 'Medical', icon: 'medical' as const, color: colors.red, bg: colors.redSoft },
    { type: 'Fire', label: 'Fire', icon: 'flame' as const, color: '#EA580C', bg: '#FFF7ED' },
  ];

  return (
    <Screen
      title={data ? `Hello, ${data.user.displayName}` : 'Safe & Connected'}
      subtitle={data ? 'Safety control center and instant emergency broadcast' : 'Keep your family connected and protected in critical moments'}
    >
      {!data ? (
        <SignIn />
      ) : (
        <>
          <ErrorNotice message={error} />

          {/* User Status Bar Card */}
          <Card tone={data.emergency ? 'danger' : 'default'} style={styles.statusBarCard}>
            <View style={styles.statusBarRow}>
              <View style={styles.userAvatarContainer}>
                {data.user.photoURL ? (
                  <Image source={{ uri: data.user.photoURL }} style={styles.userAvatar} />
                ) : (
                  <View style={styles.userAvatarPlaceholder}>
                    <Ionicons name="person" size={20} color={colors.white} />
                  </View>
                )}
                <View
                  style={[
                    styles.avatarStatusBadge,
                    { backgroundColor: data.emergency ? colors.red : sharing ? colors.green : colors.muted }
                  ]}
                />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.userNameText}>{data.user.displayName}</Text>
                  <Badge label="LINE ID" tone="line" />
                </View>
                <Text style={styles.userStatusSubtext}>
                  {data.emergency
                    ? `🚨 Broadcasting SOS: ${data.emergency.type}`
                    : sharing
                    ? '🟢 Live GPS sharing active'
                    : '⚪ Continuous tracking is off'}
                </Text>
              </View>

              <Badge
                label={data.emergency ? 'SOS ACTIVE' : 'SAFE'}
                tone={data.emergency ? 'danger' : 'safe'}
                icon={data.emergency ? 'alert' : 'shield-checkmark'}
              />
            </View>

            {/* Quick GPS Sharing Toggle in Status Bar */}
            <View style={styles.quickSharingBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons
                  name={sharing ? 'location' : 'location-outline'}
                  size={18}
                  color={sharing ? colors.green : colors.muted}
                />
                <Text style={{ fontSize: 13, color: colors.ink, fontWeight: '600' }}>
                  {sharing ? 'Family location sharing is on' : 'Family location sharing is off'}
                </Text>
              </View>
              <Pressable
                onPress={() => share(!sharing)}
                style={({ pressed }) => [
                  styles.sharingToggleBtn,
                  { backgroundColor: sharing ? colors.greenSoft : colors.surfaceSubtle, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={[styles.sharingToggleText, { color: sharing ? colors.greenDark : colors.inkSecondary }]}>
                  {sharing ? 'Stop Sharing' : 'Share Live'}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Interactive Concentric Glowing SOS Button */}
          <View style={styles.sosContainer}>
            <View style={styles.sosOuterGlow}>
              <View style={styles.sosMidGlow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send Emergency SOS Alert"
                  onPress={() => router.push(selectedQuickType ? { pathname: '/sos', params: { preset: selectedQuickType } } : '/sos')}
                  style={({ pressed }) => [
                    styles.sosMainBtn,
                    { transform: [{ scale: pressed ? 0.95 : 1 }], opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <View style={styles.sosInnerRing}>
                    <Ionicons name="warning" size={32} color={colors.white} />
                    <Text style={styles.sosText}>SOS</Text>
                    <Text style={styles.sosSubtext}>PRESS FOR HELP</Text>
                  </View>
                </Pressable>
              </View>
            </View>
            <Text style={styles.sosHintText}>
              When triggered, your real-time GPS coordinates are immediately broadcasted to all family members.
            </Text>
          </View>

          {/* Emergency Quick Presets Bar */}
          <Card tone="default">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Heading size="sm">Emergency Categories (Quick SOS)</Heading>
              <Badge label="1-Tap SOS" tone="danger" />
            </View>
            <View style={styles.quickTypeGrid}>
              {emergencyQuickTypes.map(item => (
                <Pressable
                  key={item.type}
                  onPress={() => router.push({ pathname: '/sos', params: { preset: item.type } })}
                  style={({ pressed }) => [
                    styles.quickTypeCard,
                    { backgroundColor: item.bg, opacity: pressed ? 0.75 : 1 }
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                  <Text style={[styles.quickTypeLabel, { color: item.color }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Quick Navigation Cards (Family & Live Map) */}
          <View style={styles.navRow}>
            <Pressable
              onPress={() => router.push('/family')}
              style={({ pressed }) => [styles.navCard, { backgroundColor: '#F0FDF4', opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.navIconBox, { backgroundColor: colors.greenSoft }]}>
                <Ionicons name="people" size={24} color={colors.green} />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={styles.navCardTitle}>My Family</Text>
                <Text style={styles.navCardSubtitle}>
                  {data.family ? `${data.family.name} (${data.members.length} members)` : 'No family group yet'}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/map')}
              style={({ pressed }) => [styles.navCard, { backgroundColor: '#EFF6FF', opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.navIconBox, { backgroundColor: colors.blueSoft }]}>
                <Ionicons name="map" size={24} color={colors.blue} />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={styles.navCardTitle}>Live Map</Text>
                <Text style={styles.navCardSubtitle}>View locations & alerts</Text>
              </View>
            </Pressable>
          </View>

          {/* Family Presence Overview */}
          {data.family ? (
            <Card tone="default">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Heading size="sm">Family Members ({data.members.length})</Heading>
                <Pressable onPress={() => router.push('/family')}>
                  <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 13 }}>Manage Family ›</Text>
                </Pressable>
              </View>

              <View style={styles.memberAvatarList}>
                {data.members.map(member => (
                  <Pressable
                    key={member.id}
                    onPress={() => router.push(member.location ? { pathname: '/map', params: { member: member.id } } : '/family')}
                    style={styles.memberAvatarItem}
                  >
                    <View style={styles.memberAvatarWrapper}>
                      {member.photoURL ? (
                        <Image source={{ uri: member.photoURL }} style={styles.memberAvatarImg} />
                      ) : (
                        <View style={[styles.memberAvatarImg, { backgroundColor: colors.mutedLight, alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="person" size={16} color={colors.white} />
                        </View>
                      )}
                      <View
                        style={[
                          styles.memberStatusDot,
                          { backgroundColor: member.emergency ? colors.red : member.isSharing ? colors.green : colors.mutedLight }
                        ]}
                      />
                    </View>
                    <Text style={styles.memberAvatarName} numberOfLines={1}>
                      {member.displayName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : (
            <Card tone="info">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="people-circle" size={32} color={colors.blue} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Heading size="sm">Connect with Family</Heading>
                  <Body style={{ fontSize: 13 }}>Create a family circle to view live locations and provide instant assistance.</Body>
                </View>
              </View>
              <Button label="Create Family / Join with Code" tone="primary" size="sm" onPress={() => router.push('/family')} />
            </Card>
          )}

          {/* Emergency Hotlines Widget */}
          <EmergencyHotlinesWidget />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusBarCard: {
    padding: 16,
    gap: 12
  },
  statusBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  userAvatarContainer: {
    position: 'relative'
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.cardBorder
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink
  },
  userStatusSubtext: {
    fontSize: 12,
    color: colors.muted
  },
  quickSharingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2
  },
  sharingToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8
  },
  sharingToggleText: {
    fontSize: 12,
    fontWeight: '800'
  },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: 14
  },
  sosOuterGlow: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sosMidGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sosMainBtn: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.red,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  sosInnerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  sosText: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 42
  },
  sosSubtext: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    opacity: 0.9
  },
  sosHintText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320
  },
  quickTypeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  quickTypeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 4
  },
  quickTypeLabel: {
    fontSize: 12,
    fontWeight: '800'
  },
  navRow: {
    flexDirection: 'row',
    gap: 12
  },
  navCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10
  },
  navIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink
  },
  navCardSubtitle: {
    fontSize: 12,
    color: colors.muted
  },
  memberAvatarList: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
    flexWrap: 'wrap'
  },
  memberAvatarItem: {
    alignItems: 'center',
    gap: 4,
    width: 60
  },
  memberAvatarWrapper: {
    position: 'relative'
  },
  memberAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.cardBorder
  },
  memberStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white
  },
  memberAvatarName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center'
  }
});

