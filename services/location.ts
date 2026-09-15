import * as ExpoLocation from 'expo-location';
import type { Location } from '../types';
export async function currentLocation(): Promise<Location> {
  const permission = await ExpoLocation.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Location permission is required. Enable it in your device settings.');
  if (!await ExpoLocation.hasServicesEnabledAsync()) throw new Error('Location services are off. Please enable GPS.');
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High }), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('GPS timed out. Move to an open area and try again.')), 20000); })]);
    return { latitude: result.coords.latitude, longitude: result.coords.longitude, accuracy: result.coords.accuracy, updatedAt: Date.now() };
  } finally { clearTimeout(timeout); }
}
