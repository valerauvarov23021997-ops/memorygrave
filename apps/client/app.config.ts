import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Память',
  slug: 'pamyat-client',
  version: '1.0.0',
  scheme: 'pamyat',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1C3318',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'app.pamyat.client',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Для отображения кладбища на карте',
      NSCameraUsageDescription: 'Для загрузки фотографий',
      NSPhotoLibraryUsageDescription: 'Для выбора фото из галереи',
    },
  },
  android: {
    package: 'app.pamyat.client',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1C3318',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    ['expo-notifications', { icon: './assets/notification-icon.png' }],
    ['react-native-maps', { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }],
  ],
  experiments: {
    typedRoutes: true,
  },
}

export default config
