import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Память',
  slug: 'pamyat-client',
  version: '1.0.0',
  scheme: 'pamyat',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  primaryColor: '#1C3318',
  // projectId подставляется автоматически после `eas init` (см. docs/RELEASE.md)
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FAF7F2',
  },
  assetBundlePatterns: ['**/*'],
  // sdkVersion-политика нужна для тестирования опубликованных обновлений в Expo Go
  runtimeVersion: { policy: 'sdkVersion' },
  web: { output: 'single', bundler: 'metro' },
  ios: {
    bundleIdentifier: 'app.pamyat.client',
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription: 'Доступ к камере нужен, чтобы прикреплять фотографии к воспоминаниям и заказам',
      NSPhotoLibraryUsageDescription: 'Доступ к фото нужен, чтобы выбрать снимки для страницы памяти',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'app.pamyat.client',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F0EBE0',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    ['expo-notifications', { icon: './assets/notification-icon.png' }],
    [
      'expo-image-picker',
      {
        photosPermission: 'Доступ к фото нужен, чтобы выбрать снимки для страницы памяти',
        cameraPermission: 'Доступ к камере нужен, чтобы прикреплять фотографии к воспоминаниям',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
}

export default config
