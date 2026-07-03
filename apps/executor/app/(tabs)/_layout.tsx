import { colors, Icon, radii } from '@pamyat/ui'
import { BlurView } from 'expo-blur'
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabsLayout() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.stone,
        // Парящий стеклянный таб-бар — как в клиентском приложении
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom - 18, 10),
          height: 68,
          borderRadius: radii.xl,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowColor: colors.forest,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          paddingTop: 6,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              {
                borderTopLeftRadius: radii.xl,
                borderTopRightRadius: radii.xl,
                overflow: 'hidden',
                backgroundColor: 'rgba(250,247,242,0.86)',
                borderTopWidth: 1,
                borderColor: colors.linen,
              },
            ]}
          />
        ),
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.active'),
          tabBarIcon: ({ color, focused }) => <Icon name="orders" size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, focused }) => <Icon name="checkCircle" size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => <Icon name="profile" size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
    </Tabs>
  )
}
