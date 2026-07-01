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
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.linen,
        },
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <Icon name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('tabs.saved'),
          tabBarIcon: ({ color }) => <Icon name="saved" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color }) => <Icon name="orders" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Icon name="profile" size={22} color={color} />,
        }}
      />
    </Tabs>
  )
}
