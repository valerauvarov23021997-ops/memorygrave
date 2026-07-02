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
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Приложению нужен доступ к геолокации, чтобы показать кладбище на карте',
      NSCameraUsageDescription: 'Доступ к камере нужен, чтобы прикреплять фотографии к воспоминаниям и заказам',
      NSPhotoLibraryUsageDescription: 'Доступ к фото нужен, чтобы выбрать снимки для страницы памяти',
      ITSAppUsesNonExemptEncryption: false,
    },
    // Ключ Google Maps для iOS (react-native-maps не поставляет config-plugin).
    config: { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY },
  },
  android: {
    package: 'app.pamyat.client',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1C3318',
    },
    config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    ['expo-notifications', { icon: './assets/notification-icon.png' }],
  ],
  experiments: {
    typedRoutes: true,
  },
}

export default config
