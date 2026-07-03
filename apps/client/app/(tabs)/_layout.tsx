import { Icon, radii, useColors } from '@pamyat/ui'
import { BlurView } from 'expo-blur'
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabsLayout() {
  const { t } = useTranslation()
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: c.forest,
        tabBarInactiveTintColor: c.stone,
        // Стеклянный таб-бар, прижатый к нижнему краю
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 6 : 8,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowColor: c.forest,
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
                borderColor: c.linen,
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
          title: t('tabs.search'),
          tabBarIcon: ({ color, focused }) => <Icon name="search" size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('tabs.saved'),
          tabBarIcon: ({ color, focused }) => <Icon name="saved" size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color, focused }) => <Icon name="orders" size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
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
