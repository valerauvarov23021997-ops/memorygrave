import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Память · Исполнитель',
  slug: 'pamyat-executor',
  version: '1.0.0',
  scheme: 'pamyat-executor',
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
    bundleIdentifier: 'app.pamyat.executor',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Для маршрута к кладбищу',
      NSCameraUsageDescription: 'Для фотоотчёта о выполненной работе',
      NSPhotoLibraryUsageDescription: 'Для выбора фото из галереи',
    },
  },
  android: {
    package: 'app.pamyat.executor',
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
    ['expo-image-picker', { cameraPermission: 'Для фотоотчёта о выполненной работе' }],
  ],
  experiments: {
    typedRoutes: true,
  },
}

export default config
