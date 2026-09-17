// Expo SDK 54 configuration for iOS, Android, and EAS Build.
module.exports = ({ config }) => ({
  ...config,
  name: 'FindMe',
  slug: 'findme',
  scheme: 'findme',
  version: '1.0.0',
  owner: 'manutsawee',
  extra: {
    ...config.extra,
    eas: {
      projectId: '3b6babec-aa50-4d11-b7a3-fb24d2e258e4',
    },
    hasGoogleMapsAndroidKey: Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || process.env.GOOGLE_MAPS_ANDROID_API_KEY),
  },
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    './plugins/withCleartextTraffic',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow FindMe to access your location to show on the safety map and broadcast emergency SOS coordinates to your family.',
        locationAlwaysAndWhenInUsePermission: 'Allow FindMe to share real-time GPS coordinates with your family members when live sharing is active.',
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
  ],
  web: {
    ...config.web,
    bundler: 'metro',
    favicon: './assets/images/icon.png',
  },
  android: {
    ...config.android,
    package: 'com.manutsawee.findme',
    versionCode: 1,
    // Required only while the Android Emulator talks to the local development API.
    usesCleartextTraffic: true,
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#FFFFFF',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'INTERNET',
    ],
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || process.env.GOOGLE_MAPS_ANDROID_API_KEY || '',
      },
    },
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.manutsawee.findme',
    buildNumber: '1',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Allow FindMe to access your location to show on the safety map and broadcast emergency SOS coordinates to your family.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Allow FindMe to share real-time GPS coordinates with your family members when live sharing is active.',
    },
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || '',
    },
  },
});
