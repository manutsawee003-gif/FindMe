import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Button, Card, ErrorNotice, Heading, Input, Screen, Badge, EmergencyHotlinesWidget } from '../components/ui';
import { SignIn } from '../components/SignIn';
import { api } from '../services/api';
import { currentLocation } from '../services/location';
import { useSession } from '../services/session';
import { colors } from '../constants/theme';
import type { Location } from '../types';

export default function SOS() {
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const { data, refresh, setEmergency } = useSession();
  const [type, setType] = useState(preset || 'Flood');
  const [people, setPeople] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState<Location | null>(null);

  useEffect(() => {
    if (preset) setType(preset);
  }, [preset]);

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e: any) {
      setError(e.message || 'An error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const emergencyCategories = [
    { type: 'Flood', label: 'Flash Flood / Rising Water', sub: 'Requires boat / immediate rescue', icon: 'water' as const, color: colors.blue, bg: colors.blueSoft },
    { type: 'Accident', label: 'Traffic / Road Accident', sub: 'Collision or road hazard', icon: 'car' as const, color: colors.amber, bg: colors.amberSoft },
    { type: 'Trapped', label: 'Trapped in Building', sub: 'Exit blocked / isolated', icon: 'warning' as const, color: colors.amber, bg: colors.amberSoft },
    { type: 'Medical', label: 'Medical Emergency', sub: 'Requires paramedic / ambulance', icon: 'medical' as const, color: colors.red, bg: colors.redSoft },
    { type: 'Fire', label: 'Fire / Smoke Hazard', sub: 'Dense smoke / active flame', icon: 'flame' as const, color: '#EA580C', bg: '#FFF7ED' },
    { type: 'Other', label: 'Other Emergency', sub: 'Immediate assistance needed', icon: 'alert-circle' as const, color: colors.purple, bg: colors.purpleSoft },
  ];

  const quickMessageSuggestions = [
    'Children and elderly present',
    'Water level rising rapidly',
    'No electricity / low phone battery',
    'Urgent drinking water and food needed',
  ];

  return (
    <Screen
      title={data?.emergency ? '🚨 SOS Broadcast Active' : 'Send Emergency Alert (SOS)'}
      subtitle={
        data?.emergency
          ? 'Your real-time GPS location and emergency details are being broadcasted'
          : 'Select emergency category to broadcast your GPS coordinates immediately'
      }
    >
      {!data ? (
        <SignIn />
      ) : (
        <>
          <ErrorNotice message={error} />

          {data.emergency ? (
            /* ACTIVE SOS MANAGEMENT CARD */
            <Card tone="danger" style={styles.activeSosCard}>
              <View style={styles.activeSosHeader}>
                <View style={styles.activeSosPulseIcon}>
                  <Ionicons name="warning" size={28} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Badge label="ACTIVE EMERGENCY" tone="danger" icon="alert" />
                  <Heading size="lg" color={colors.redDark}>
                    {data.emergency.type} · Alert Active
                  </Heading>
                  <Text style={styles.activeSosTime}>
                    Broadcasted at {new Date(data.emergency.createdAt).toLocaleTimeString('en-US')} ({data.emergency.people} {data.emergency.people === 1 ? 'person' : 'people'})
                  </Text>
                </View>
              </View>

              <View style={styles.activeSosCoordsBox}>
                <Ionicons name="navigate-circle" size={20} color={colors.red} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeCoordsLabel}>Recorded GPS Coordinates:</Text>
                  <Text style={styles.activeCoordsVal}>
                    {data.emergency.location.latitude.toFixed(6)}, {data.emergency.location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>

              {data.emergency.message ? (
                <View style={styles.activeMessageBox}>
                  <Text style={styles.activeMessageLabel}>Additional Details:</Text>
                  <Text style={styles.activeMessageText}>{data.emergency.message}</Text>
                </View>
              ) : null}

              <View style={{ gap: 10, marginTop: 6 }}>
                <Button
                  label="View SOS on Live Map"
                  icon="map"
                  tone="primary"
                  onPress={() => router.push('/map')}
                />

                <Button
                  disabled={busy}
                  label={busy ? 'Saving…' : '✅ I Am Safe — Resolve SOS'}
                  tone="line"
                    onPress={() =>
                      run(async () => {
                        if (data.user.id === 'guest-local') {
                          setEmergency(null);
                          router.replace('/');
                          return;
                        }
                        await api('/sos/close', { status: 'resolved' });
                        setEmergency(null);
                      await refresh();
                      router.replace('/');
                    })
                  }
                />

                <Button
                  disabled={busy}
                  label="Cancel SOS Alert"
                  tone="secondary"
                  size="sm"
                    onPress={() =>
                      run(async () => {
                        if (data.user.id === 'guest-local') {
                          setEmergency(null);
                          return;
                        }
                        await api('/sos/close', { status: 'cancelled' });
                        setEmergency(null);
                      await refresh();
                    })
                  }
                />
              </View>
            </Card>
          ) : (
            /* CREATE SOS FORM */
            <Card tone="default">
              <Heading size="sm">1. Select Emergency Type</Heading>
              <View style={{ gap: 8 }}>
                {emergencyCategories.map(cat => {
                  const isSelected = type === cat.type;
                  return (
                    <Pressable
                      key={cat.type}
                      onPress={() => {
                        setType(cat.type);
                        setPosition(null);
                      }}
                      style={({ pressed }) => [
                        styles.catOption,
                        {
                          borderColor: isSelected ? cat.color : colors.cardBorder,
                          backgroundColor: isSelected ? cat.bg : colors.surfaceSubtle,
                          opacity: pressed ? 0.8 : 1
                        }
                      ]}
                    >
                      <View style={[styles.catIconBox, { backgroundColor: cat.color + '20' }]}>
                        <Ionicons name={cat.icon} size={22} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.catOptionTitle, isSelected && { color: cat.color }]}>
                          {cat.label}
                        </Text>
                        <Text style={styles.catOptionSub}>{cat.sub}</Text>
                      </View>
                      <View
                        style={[
                          styles.catRadio,
                          { borderColor: isSelected ? cat.color : colors.mutedLight }
                        ]}
                      >
                        {isSelected && <View style={[styles.catRadioInner, { backgroundColor: cat.color }]} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Number of People Stepper */}
              <View style={{ gap: 8, marginTop: 4 }}>
                <Heading size="sm">2. People in Need of Assistance</Heading>
                <View style={styles.stepperContainer}>
                  <Pressable
                    disabled={people <= 1}
                    onPress={() => setPeople(Math.max(1, people - 1))}
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      { opacity: people <= 1 ? 0.4 : pressed ? 0.7 : 1 }
                    ]}
                  >
                    <Ionicons name="remove" size={22} color={colors.ink} />
                  </Pressable>
                  <View style={styles.stepperValueContainer}>
                    <Text style={styles.stepperValueText}>{people}</Text>
                    <Text style={styles.stepperUnitText}>{people === 1 ? 'Person' : 'People'}</Text>
                  </View>
                  <Pressable
                    disabled={people >= 100}
                    onPress={() => setPeople(people + 1)}
                    style={({ pressed }) => [
                      styles.stepperBtn,
                      { opacity: people >= 100 ? 0.4 : pressed ? 0.7 : 1 }
                    ]}
                  >
                    <Ionicons name="add" size={22} color={colors.ink} />
                  </Pressable>
                </View>
              </View>

              {/* Additional Message / Details */}
              <View style={{ gap: 8, marginTop: 4 }}>
                <Heading size="sm">3. Additional Details (Optional)</Heading>
                <Input
                  label="Situation / Landmarks / Needs"
                  placeholder="e.g. 2nd floor, need medical help, water rising..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {quickMessageSuggestions.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => setMessage(prev => (prev ? `${prev} · ${item}` : item))}
                      style={({ pressed }) => [
                        styles.quickMsgChip,
                        { opacity: pressed ? 0.7 : 1 }
                      ]}
                    >
                      <Text style={styles.quickMsgText}>+ {item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* GPS Confirmation & Submit Area */}
              {position ? (
                <View style={styles.confirmationBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.green} />
                    <Heading size="sm">GPS Coordinates Ready</Heading>
                  </View>
                  <Text style={styles.coordsText}>
                    Latitude: {position.latitude.toFixed(6)}, Longitude: {position.longitude.toFixed(6)}
                    {position.accuracy != null ? ` (Accuracy ±${Math.round(position.accuracy)} m)` : ''}
                  </Text>
                  <Text style={styles.disclaimerText}>
                    {data.family
                      ? `Alert will be broadcasted to family circle "${data.family.name}" and displayed on the safety map.`
                      : 'You do not have a family circle yet. SOS will be logged to your account.'}
                  </Text>

                  <View style={{ gap: 8, marginTop: 6 }}>
                    <Button
                      tone="danger"
                      size="lg"
                      icon="warning"
                      disabled={busy}
                      label={busy ? 'Broadcasting SOS…' : '🚨 Confirm & Broadcast SOS Now'}
                      onPress={() =>
                        run(async () => {
                          const fresh =
                            Date.now() - position.updatedAt < 60000 ? position : await currentLocation();
                          if (data.user.id === 'guest-local') {
                            setEmergency({ id: `local-${Date.now()}`, userId: data.user.id, type, message, people, location: fresh, status: 'pending', createdAt: Date.now() });
                            return;
                          }
                          await api('/sos', {
                            type,
                            people,
                            message,
                            location: fresh
                          });
                          await refresh();
                        })
                      }
                    />
                    <Button
                      label="Edit Emergency Details"
                      tone="outline"
                      size="sm"
                      onPress={() => setPosition(null)}
                    />
                  </View>
                </View>
              ) : (
                <Button
                  tone="danger"
                  size="lg"
                  icon="navigate"
                  disabled={busy}
                  label={busy ? 'Locating GPS coordinates…' : 'Get GPS Location & Review SOS'}
                  onPress={() =>
                    run(async () => {
                      const pos = await currentLocation();
                      setPosition(pos);
                    })
                  }
                />
              )}
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
  activeSosCard: {
    padding: 20,
    gap: 14,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  activeSosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  activeSosPulseIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.red,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  activeSosTime: {
    fontSize: 12,
    color: colors.redDark,
    marginTop: 2
  },
  activeSosCoordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.redBorder
  },
  activeCoordsLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600'
  },
  activeCoordsVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink
  },
  activeMessageBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4
  },
  activeMessageLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700'
  },
  activeMessageText: {
    fontSize: 13,
    color: colors.ink
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5
  },
  catIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  catOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink
  },
  catOptionSub: {
    fontSize: 11,
    color: colors.muted
  },
  catRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  catRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder
  },
  stepperValueContainer: {
    alignItems: 'center',
    gap: 2
  },
  stepperValueText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink
  },
  stepperUnitText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600'
  },
  quickMsgChip: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder
  },
  quickMsgText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSecondary
  },
  confirmationBox: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginTop: 6
  },
  coordsText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.greenDark
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16
  }
});
