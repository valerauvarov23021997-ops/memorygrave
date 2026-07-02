import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Память · Исполнитель',
  slug: 'pamyat-executor',
  version: '1.0.0',
  scheme: 'pamyat-executor',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  primaryColor: '#1C3318',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1C3318',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'app.pamyat.executor',
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Доступ к геолокации нужен, чтобы построить маршрут к кладбищу',
      NSCameraUsageDescription: 'Доступ к камере нужен для фотоотчёта о выполненной работе',
      NSPhotoLibraryUsageDescription: 'Доступ к фото нужен, чтобы выбрать снимки для отчёта',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'app.pamyat.executor',
    versionCode: 1,
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
