import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import type { MapPoint } from './map-types';

type Coordinate = { lat: number; lng: number };
type MapInstance = {
  fitBounds: (bounds: Bounds) => void;
  setCenter: (point: Coordinate) => void;
  setZoom: (zoom: number) => void;
};
type Bounds = { extend: (point: Coordinate) => void };
type GoogleMaps = {
  Map: new (element: HTMLElement, options: object) => MapInstance;
  Marker: new (options: object) => { setMap: (map: null) => void };
  LatLngBounds: new () => Bounds;
};

declare global {
  interface Window {
    google?: { maps: GoogleMaps };
    gm_authFailure?: () => void;
  }
}

let loading: Promise<void> | null = null;

function loadMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;
      if (!key) {
        reject(new Error('Google Maps web key is not configured.'));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=th,en`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error('Google Maps could not load. Check your connection.'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export default function MapCanvas({ points, selected }: { points: MapPoint[]; selected?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [useRadar, setUseRadar] = useState(false);

  useEffect(() => {
    let live = true;
    window.gm_authFailure = () => {
      if (live) {
        setError('Google Maps API Key restricted — switching to Radar View');
        setUseRadar(true);
      }
    };
    loadMaps()
      .then(() => {
        if (!live || !host.current || !window.google?.maps) return;
        map.current = new window.google.maps.Map(host.current, {
          center: { lat: 13.7563, lng: 100.5018 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        setLoaded(true);
      })
      .catch(e => {
        setError(e.message);
        setUseRadar(true);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !window.google?.maps || !map.current) return;
    const maps = window.google.maps;
    const bounds = new maps.LatLngBounds();
    const markers = points.map(point => {
      const position = { lat: point.location.latitude, lng: point.location.longitude };
      bounds.extend(position);
      return new maps.Marker({
        map: map.current,
        position,
        title: `${point.name}${point.emergency ? ` · SOS: ${point.emergency}` : ''}`,
        label: point.emergency ? '!' : undefined
      });
    });

    const chosen = points.find(p => p.id === selected);
    if (chosen || points.length === 1) {
      const p = chosen || points[0];
      map.current.setCenter({ lat: p.location.latitude, lng: p.location.longitude });
      map.current.setZoom(15);
    } else if (points.length) {
      map.current.fitBounds(bounds);
    }

    return () => markers.forEach(m => m.setMap(null));
  }, [loaded, JSON.stringify(points), selected]);

  // If Radar Mode is active (e.g. when Google Maps is unavailable or user toggles)
  if (useRadar) {
    return (
      <View style={styles.radarContainer}>
        {/* Radar Rings & Grid */}
        <View style={styles.radarRingOuter} />
        <View style={styles.radarRingMid} />
        <View style={styles.radarRingInner} />
        <View style={styles.radarCrossHorizontal} />
        <View style={styles.radarCrossVertical} />

        {/* Center You Pin */}
        <View style={styles.centerRadarPoint}>
          <View style={styles.centerDot} />
          <Text style={styles.centerLabel}>Your Location (You)</Text>
        </View>

        {/* Dynamic Target Pins plotted on radar */}
        {points.map((pt, idx) => {
          const angle = (idx * (360 / Math.max(1, points.length)) * Math.PI) / 180;
          const dist = 60 + (idx % 3) * 35;
          const top = 180 + Math.sin(angle) * dist - 16;
          const left = 180 + Math.cos(angle) * dist - 16;

          return (
            <View
              key={pt.id}
              style={[
                styles.radarTargetPin,
                {
                  top,
                  left,
                  backgroundColor: pt.emergency ? colors.red : colors.blue,
                  borderColor: pt.id === selected ? colors.white : 'transparent',
                  borderWidth: pt.id === selected ? 2 : 0
                }
              ]}
            >
              <Ionicons
                name={pt.emergency ? 'warning' : 'person'}
                size={14}
                color={colors.white}
              />
            </View>
          );
        })}

        <View style={styles.radarHeaderBadge}>
          <View style={styles.radarLiveDot} />
          <Text style={styles.radarBadgeText}>TACTICAL RADAR SCANNER · {points.length} SIGNALS</Text>
        </View>
      </View>
    );
  }

  return (
    <div
      ref={host}
      aria-label="Family Google Map"
      style={{
        height: 380,
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        background: '#E2E8F0'
      }}
    />
  );
}

const styles = StyleSheet.create({
  radarContainer: {
    height: 380,
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radarRingOuter: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: '#33415560'
  },
  radarRingMid: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: '#33415590'
  },
  radarRingInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#38BDF840'
  },
  radarCrossHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#33415540'
  },
  radarCrossVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#33415540'
  },
  centerRadarPoint: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  centerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.white
  },
  centerLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#00000080',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  radarTargetPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  radarHeaderBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293BCC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  radarLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green
  },
  radarBadgeText: {
    color: colors.greenBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  }
});

