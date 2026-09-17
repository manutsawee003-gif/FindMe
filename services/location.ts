import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';
import type { Location } from '../types';
export async function currentLocation(): Promise<Location> {
  // expo-location's native service checks are not available in the browser.
  // Use the browser geolocation API when running the web preview instead.
  if (Platform.OS === 'web') {
    if (!navigator.geolocation) throw new Error('This browser does not support location services.');
    return new Promise<Location>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          resolve({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            updatedAt: Date.now(),
          }),
        error =>
          reject(
            new Error(
              error.code === 1
                ? 'Location permission was denied. Allow location access for this site.'
                : 'Unable to read your browser location.'
            )
          ),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  const permission = await ExpoLocation.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Location permission is required. Enable it in your device settings.');
  if (!(await ExpoLocation.hasServicesEnabledAsync())) throw new Error('Location services are off. Please enable GPS.');

  try {
    // Request fresh high-accuracy position from Android/iOS GPS & Google Play Services
    const pos = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.High,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      updatedAt: pos.timestamp || Date.now(),
    };
  } catch {
    // Fallback if pure GPS lock is slow indoors: try balanced accuracy or last known position
    try {
      const fallback = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      return {
        latitude: fallback.coords.latitude,
        longitude: fallback.coords.longitude,
        accuracy: fallback.coords.accuracy,
        updatedAt: fallback.timestamp || Date.now(),
      };
    } catch {
      const last = await ExpoLocation.getLastKnownPositionAsync();
      if (last) {
        return {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          accuracy: last.coords.accuracy,
          updatedAt: last.timestamp || Date.now(),
        };
      }
      throw new Error('Unable to read GPS location. Please ensure GPS is enabled and you have good signal.');
    }
  }
}
