// Expo SDK 54 configuration for iOS, Android, and EAS Build.
module.exports = ({ config }) => ({
  ...config,
  name: 'FindMe',
  slug: 'findme',
  scheme: 'findme',
  version: '1.0.0',
  // Do not inherit an EAS project ID from a previous local Expo configuration.
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      projectId: '5f27f712-23f3-40f9-b2d4-344c4238b8a9',
    },
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
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || '',
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
