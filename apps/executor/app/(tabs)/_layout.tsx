import { colors, Icon } from '@pamyat/ui'
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function TabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.stone,
        tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.linen },
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
