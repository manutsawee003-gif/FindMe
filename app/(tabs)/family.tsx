import { useState } from 'react';
import { router } from 'expo-router';
import { Platform, Share, Text, View, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Button, Card, ErrorNotice, Heading, Input, Screen, Badge } from '../../components/ui';
import { SignIn } from '../../components/SignIn';
import { api } from '../../services/api';
import { useSession } from '../../services/session';
import { colors } from '../../constants/theme';

export default function Family() {
  const { data, refresh, sharing, share } = useSession();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState('');
  const [copied, setCopied] = useState(false);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e: any) {
      setError(e.message || 'An error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const inviteBase = Platform.OS === 'web' ? window.location.origin : process.env.EXPO_PUBLIC_WEB_URL;
  const inviteLink = inviteBase ? `${inviteBase}/join?code=${invite}` : `findme://join?code=${invite}`;
  const message = `Join our FindMe family circle to share live locations and receive SOS alerts.\nInvite Code: ${invite}\nJoin Link: ${inviteLink}`;

  const copyToClipboard = () => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      Share.share({ message: `FindMe Family Code: ${invite}` });
    }
  };

  return (
    <Screen
      title={data?.family ? data.family.name : 'Family Circle'}
      subtitle="Connect with loved ones for continuous safety and instant emergency response"
    >
      {!data ? (
        <SignIn />
      ) : (
        <>
          <ErrorNotice message={error} />

          {!data.family ? (
            /* NO FAMILY YET - ONBOARDING */
            <View style={{ gap: 16 }}>
              {/* Create Family Card */}
              <Card tone="default" style={styles.createFamilyCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="people" size={28} color={colors.green} />
                </View>
                <Heading size="md">Create New Family Circle</Heading>
                <Body style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                  Name your household group to start sharing real-time locations and safety alerts.
                </Body>
                <View style={{ width: '100%' }}>
                  <Input
                    label="Family Group Name"
                    placeholder="e.g. Anderson Family, Home Base"
                    value={name}
                    onChangeText={setName}
                    icon="home"
                  />
                </View>
                <View style={{ width: '100%' }}>
                  <Button
                    disabled={busy || !name.trim()}
                    label={busy ? 'Creating family...' : 'Create Family'}
                    tone="primary"
                    icon="add-circle"
                    onPress={() =>
                      run(async () => {
                        await api('/family', { name });
                        const result = await api<{ code: string }>('/family/invite', {});
                        setInvite(result.code);
                        await refresh();
                      })
                    }
                  />
                </View>
              </Card>

              {/* Join with Invite Code Card */}
              <Card tone="default">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.blueSoft }]}>
                    <Ionicons name="key" size={22} color={colors.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Heading size="sm">Have an Invite Code?</Heading>
                    <Text style={{ fontSize: 12, color: colors.muted }}>Join an existing family circle created by a family member</Text>
                  </View>
                </View>

                <Input
                  label="Family Invite Code"
                  placeholder="e.g. ABC123XYZ"
                  value={code}
                  onChangeText={setCode}
                  icon="qr-code"
                />
                <Button
                  disabled={!code.trim()}
                  label="Verify & Join Family"
                  tone="secondary"
                  onPress={() => router.push({ pathname: '/join', params: { code: code.trim() } })}
                />
              </Card>
            </View>
          ) : (
            /* FAMILY CONNECTED VIEW */
            <>
              {/* Family Header Banner */}
              <Card tone="safe" style={styles.familyHeaderCard}>
                <View style={styles.familyHeaderRow}>
                  <View style={styles.familyHeaderIcon}>
                    <Ionicons name="shield-checkmark" size={26} color={colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Badge label="FAMILY CIRCLE" tone="safe" />
                    <Heading size="lg">{data.family.name}</Heading>
                    <Text style={styles.familyMemberCount}>
                      {data.members.length} total members
                    </Text>
                  </View>
                </View>

                {/* Location Sharing Quick Switch */}
                <View style={styles.sharingControlBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View
                      style={[
                        styles.sharingDot,
                        { backgroundColor: sharing ? colors.green : colors.mutedLight }
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sharingTitle}>
                        {sharing ? 'Live GPS Sharing is Active' : 'Location Sharing is Paused'}
                      </Text>
                      <Text style={styles.sharingSubtitle}>
                        {sharing ? 'Updating coordinates automatically while app is open' : 'Turn on sharing so family members can locate you on the map'}
                      </Text>
                    </View>
                  </View>

                  <Button
                    size="sm"
                    disabled={busy}
                    label={sharing ? 'Pause' : 'Share GPS'}
                    tone={sharing ? 'secondary' : 'line'}
                    onPress={() => run(() => share(!sharing))}
                  />
                </View>

                <Button
                  label="Open Family Live Map"
                  icon="map"
                  tone="primary"
                  onPress={() => router.push('/map')}
                />
              </Card>

              {/* Members List */}
              <View style={{ gap: 10 }}>
                <Heading size="sm">Family Members ({data.members.length})</Heading>
                {data.members.map(member => {
                  const isYou = member.id === data.user.id;
                  return (
                    <Card key={member.id} tone={member.emergency ? 'danger' : 'default'} style={styles.memberCard}>
                      <View style={styles.memberCardRow}>
                        <View style={styles.memberAvatarWrapper}>
                          {member.photoURL ? (
                            <Image source={{ uri: member.photoURL }} style={styles.memberAvatar} />
                          ) : (
                            <View style={styles.memberAvatarPlaceholder}>
                              <Ionicons name="person" size={20} color={colors.white} />
                            </View>
                          )}
                          <View
                            style={[
                              styles.memberBadgeDot,
                              {
                                backgroundColor: member.emergency
                                  ? colors.red
                                  : member.isSharing
                                  ? colors.green
                                  : colors.mutedLight
                              }
                            ]}
                          />
                        </View>

                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.memberName}>{member.displayName}</Text>
                            {isYou && <Badge label="You" tone="info" />}
                          </View>

                          <Text
                            style={[
                              styles.memberStatusText,
                              member.emergency && { color: colors.red, fontWeight: '700' }
                            ]}
                          >
                            {member.emergency
                              ? `🚨 Requesting SOS (${member.emergency.type})`
                              : member.isSharing
                              ? '🟢 Live GPS sharing on'
                              : '⚪ Offline / Not sharing'}
                          </Text>

                          {member.location && (
                            <Text style={styles.memberLastSeen}>
                              Last updated: {new Date(member.location.updatedAt).toLocaleTimeString('en-US')}
                            </Text>
                          )}
                        </View>

                        {member.location && (
                          <Pressable
                            onPress={() => router.push({ pathname: '/map', params: { member: member.id } })}
                            style={({ pressed }) => [
                              styles.viewOnMapBtn,
                              { opacity: pressed ? 0.75 : 1 }
                            ]}
                          >
                            <Ionicons name="navigate" size={16} color={colors.blue} />
                            <Text style={styles.viewOnMapText}>View Map</Text>
                          </Pressable>
                        )}
                      </View>
                    </Card>
                  );
                })}
              </View>

              {/* Invitation Hub Card */}
              <Card tone="default" style={styles.inviteHubCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.lineSoft }]}>
                    <Ionicons name="person-add" size={22} color={colors.lineDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Heading size="sm">Invite Family Members</Heading>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      Invite codes support up to 10 members and expire in 24 hours.
                    </Text>
                  </View>
                </View>

                {!invite ? (
                  <Button
                    disabled={busy}
                    label="Generate Invite Code"
                    icon="key"
                    tone="secondary"
                    onPress={() =>
                      run(async () => {
                        const result = await api<{ code: string }>('/family/invite', {});
                        setInvite(result.code);
                      })
                    }
                  />
                ) : (
                  <View style={styles.inviteCodeArea}>
                    <Text style={styles.inviteCodeLabel}>Your Family Invite Code:</Text>
                    <View style={styles.inviteCodeDisplayBox}>
                      <Text style={styles.inviteCodeValue} selectable>
                        {invite}
                      </Text>
                      <Pressable onPress={copyToClipboard} style={styles.copyBtn}>
                        <Ionicons name={copied ? 'checkmark' : 'copy'} size={18} color={colors.blue} />
                        <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
                      </Pressable>
                    </View>

                    <View style={{ gap: 8, marginTop: 4 }}>
                      <Button
                        tone="outline"
                        size="sm"
                        label="Share via Other Apps"
                        onPress={() =>
                          run(async () => {
                            await Share.share({ message });
                          })
                        }
                      />
                    </View>
                  </View>
                )}
              </Card>

              <Button
                tone="outline"
                size="sm"
                icon="exit-outline"
                label="Leave Family"
                disabled={busy}
                onPress={() => run(async () => {
                  await api('/family/leave', {});
                  await refresh();
                })}
              />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  createFamilyCard: {
    padding: 20,
    gap: 14,
    alignItems: 'center',
    textAlign: 'center'
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  familyHeaderCard: {
    padding: 20,
    gap: 14
  },
  familyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  familyHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.greenBorder
  },
  familyMemberCount: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2
  },
  sharingControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.greenBorder
  },
  sharingDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  sharingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink
  },
  sharingSubtitle: {
    fontSize: 11,
    color: colors.muted
  },
  memberCard: {
    padding: 14
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  memberAvatarWrapper: {
    position: 'relative'
  },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.cardBorder
  },
  memberAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center'
  },
  memberBadgeDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white
  },
  memberName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink
  },
  memberStatusText: {
    fontSize: 12,
    color: colors.muted
  },
  memberLastSeen: {
    fontSize: 10,
    color: colors.mutedLight
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  viewOnMapText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.blue
  },
  inviteHubCard: {
    padding: 18,
    gap: 12
  },
  inviteCodeArea: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder
  },
  inviteCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSecondary
  },
  inviteCodeDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.blueBorder
  },
  inviteCodeValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.blueDark
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.blue
  }
});
