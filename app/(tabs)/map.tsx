import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Button, Card, ErrorNotice, Heading, Screen, Badge } from '../../components/ui';
import { SignIn } from '../../components/SignIn';
import MapCanvas from '../../components/MapCanvas';
import type { MapPoint } from '../../components/map-types';
import { useSession } from '../../services/session';
import { publicApi } from '../../services/api';
import { currentLocation } from '../../services/location';
import { colors } from '../../constants/theme';
import type { Location, PublicEmergency } from '../../types';

export default function MapScreen() {
  const { data, error } = useSession();
  const { member } = useLocalSearchParams<{ member?: string }>();
  const [own, setOwn] = useState<Location | null>(null);
  const [publicEmergencies, setPublicEmergencies] = useState<PublicEmergency[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | 'family' | 'sos' | 'public'>('all');
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(member);

  useEffect(() => {
    if (member) setSelectedPointId(member);
  }, [member]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const rows = await publicApi<PublicEmergency[]>('/public/emergencies');
        if (active) setPublicEmergencies(rows);
      } catch {
        // public map remains usable when backend is offline
      }
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!data || own) return;
    let active = true;
    setBusy(true);
    currentLocation()
      .then(location => {
        if (active) setOwn(location);
      })
      .catch(e => {
        if (active) setMessage((e as Error).message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [!data, !own]);

  const allPoints: MapPoint[] =
    data?.members
      .filter(m => m.location)
      .map(m => ({
        id: m.id,
        name: m.displayName + (m.id === data.user.id ? ' (You)' : ''),
        location: m.location!,
        emergency: m.emergency?.type
      })) || [];

  if (data?.emergency && !allPoints.some(p => p.id === data.user.id)) {
    allPoints.push({
      id: data.user.id,
      name: `${data.user.displayName} (You)`,
      location: data.emergency.location,
      emergency: data.emergency.type
    });
  }

  if (own && data) {
    const existing = allPoints.find(p => p.id === data.user.id);
    if (existing && !existing.emergency) existing.location = own;
    if (!existing) allPoints.push({ id: data.user.id, name: 'Your Location (You)', location: own });
  }

  for (const emergency of publicEmergencies) {
    if (!allPoints.some(point => point.id === `public-${emergency.id}`)) {
      allPoints.push({
        id: `public-${emergency.id}`,
        name: `🚨 Public SOS · ${emergency.type}`,
        location: emergency.location,
        emergency: emergency.type
      });
    }
  }

  // Filter points based on category
  const filteredPoints = allPoints.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'family') return !p.id.startsWith('public-');
    if (filter === 'sos') return !!p.emergency;
    if (filter === 'public') return p.id.startsWith('public-');
    return true;
  });

  const selectedPoint = filteredPoints.find(p => p.id === selectedPointId) || filteredPoints[0];

  return (
    <Screen
      title="Live Safety Map"
      subtitle="Monitor real-time locations of family members and nearby emergency alerts"
    >
      <ErrorNotice message={message || error} />

      {/* Filter Segment Controls */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `All (${allPoints.length})`, icon: 'apps' as const },
          { key: 'family', label: 'Family', icon: 'people' as const },
          { key: 'sos', label: 'SOS Alerts', icon: 'warning' as const },
          { key: 'public', label: 'Public', icon: 'globe' as const },
        ].map(tab => {
          const active = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              style={({ pressed }) => [
                styles.filterChip,
                active && styles.filterChipActive,
                { opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={active ? colors.white : colors.inkSecondary}
              />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Map Canvas with Interactive Overlay */}
      <View style={styles.mapCanvasWrapper}>
        <MapCanvas points={filteredPoints} selected={selectedPointId} />
      </View>

      {/* Locate Me Action & Quick Stats */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            disabled={busy}
            icon="locate"
            tone="secondary"
            label={busy ? 'Locating...' : 'Locate Me'}
            onPress={async () => {
              setBusy(true);
              setMessage('');
              try {
                const pos = await currentLocation();
                setOwn(pos);
                setSelectedPointId(data?.user.id);
              } catch (e: any) {
                setMessage(e.message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </View>
      </View>

      {/* Target Details Card */}
      {selectedPoint && (
        <Card tone={selectedPoint.emergency ? 'danger' : 'default'} style={styles.selectedDetailCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View
                style={[
                  styles.markerIconBox,
                  { backgroundColor: selectedPoint.emergency ? colors.red : colors.blue }
                ]}
              >
                <Ionicons
                  name={selectedPoint.emergency ? 'warning' : 'person'}
                  size={18}
                  color={colors.white}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Heading size="sm">{selectedPoint.name}</Heading>
                <Text style={styles.selectedPointCoords}>
                  GPS: {selectedPoint.location.latitude.toFixed(6)}, {selectedPoint.location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>

            <Badge
              label={selectedPoint.emergency ? `SOS: ${selectedPoint.emergency}` : 'NORMAL'}
              tone={selectedPoint.emergency ? 'danger' : 'safe'}
            />
          </View>

          <View style={styles.selectedPointFooter}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.selectedPointTime}>
              Last updated: {new Date(selectedPoint.location.updatedAt).toLocaleTimeString('en-US')}
            </Text>
          </View>
        </Card>
      )}

      {/* Points Summary List */}
      <View style={{ gap: 8 }}>
        <Heading size="sm">All Map Locations ({filteredPoints.length})</Heading>
        {filteredPoints.map(p => {
          const isSelected = p.id === selectedPointId;
          return (
            <Pressable
              key={p.id}
              onPress={() => setSelectedPointId(p.id)}
              style={({ pressed }) => [
                styles.pointRowCard,
                isSelected && styles.pointRowCardSelected,
                { opacity: pressed ? 0.85 : 1 }
              ]}
            >
              <View
                style={[
                  styles.pointRowDot,
                  { backgroundColor: p.emergency ? colors.red : colors.blue }
                ]}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.pointRowTitle}>{p.name}</Text>
                <Text style={styles.pointRowSub}>
                  {p.location.latitude.toFixed(5)}, {p.location.longitude.toFixed(5)} · {new Date(p.location.updatedAt).toLocaleTimeString('en-US')}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'chevron-forward'}
                size={18}
                color={isSelected ? colors.blue : colors.mutedLight}
              />
            </Pressable>
          );
        })}
      </View>

      {!data && <SignIn />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.cardBorder
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSecondary
  },
  filterChipTextActive: {
    color: colors.white
  },
  mapCanvasWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceSubtle,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  selectedDetailCard: {
    padding: 16,
    gap: 10
  },
  markerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedPointCoords: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600'
  },
  selectedPointFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder
  },
  selectedPointTime: {
    fontSize: 11,
    color: colors.muted
  },
  pointRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder
  },
  pointRowCardSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft
  },
  pointRowDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  pointRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink
  },
  pointRowSub: {
    fontSize: 11,
    color: colors.muted
  }
});

