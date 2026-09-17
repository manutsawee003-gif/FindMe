import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import type { MapPoint } from './map-types';
import { emergencyTheme, familyPinColor } from './emergency-theme';

// react-native-maps crashes the whole Android process when Google Maps is
// rendered without a manifest API key. Keep the tab usable (and show location
// data) until a key is configured in the EAS environment.
export default function MapCanvas({ points, selected }: { points: MapPoint[]; selected?: string }) {
  const map = useRef<MapView>(null);
  // Google Maps' native Android key is intentionally not exposed to JS via an
  // EXPO_PUBLIC variable. This build-time flag lets us avoid rendering the
  // native map (which can terminate Android when the manifest has no key).
  const hasGoogleMapsKey = Boolean(Constants.expoConfig?.extra?.hasGoogleMapsAndroidKey);
  useEffect(() => {
    const point = points.find(p => p.id === selected);
    if (point) map.current?.animateToRegion({ ...point.location, latitudeDelta: 0.012, longitudeDelta: 0.012 });
    else if (points.length) map.current?.fitToCoordinates(points.map(p => p.location), { edgePadding: { top: 60, bottom: 60, left: 45, right: 45 }, animated: true });
  }, [JSON.stringify(points), selected]);
  if (!hasGoogleMapsKey) {
    return <View style={{ height: 380, width: '100%', borderRadius: 18, backgroundColor: '#E8F0F5', alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ color: '#24658A', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Live map is unavailable until a Google Maps key is configured.</Text><Text style={{ color: '#526B78', marginTop: 8, textAlign: 'center' }}>{points.length ? `${points.length} shared location(s) available below.` : 'No shared locations yet.'}</Text></View>;
  }
  const zone = (type?: string) => emergencyTheme(type);
  const initialPoint = points.find(p => p.id === selected) || points[0];
  const initialRegion = initialPoint
    ? { ...initialPoint.location, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 13.7563, longitude: 100.5018, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  return (
    <MapView
      ref={map}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton
      showsCompass
      style={{ height: 380, width: '100%', borderRadius: 18 }}
      initialRegion={initialRegion}
    >
      {points
        .filter(point => point.emergency)
        .map(point => {
          const theme = zone(point.emergency);
          return (
            <Circle
              key={`zone-${point.id}`}
              center={point.location}
              radius={500}
              strokeColor={theme.color}
              fillColor={theme.fillColor}
              strokeWidth={2}
            />
          );
        })}
      {points.map(point => {
        const theme = zone(point.emergency);
        return (
          <Marker
            key={point.id}
            coordinate={point.location}
            title={point.name}
            description={point.emergency ? theme.label : 'Family member'}
            pinColor={point.emergency ? theme.color : familyPinColor}
          />
        );
      })}
    </MapView>
  );
}
