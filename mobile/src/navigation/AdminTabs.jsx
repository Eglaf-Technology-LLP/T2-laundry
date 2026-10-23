import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton } from 'react-native-paper';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminItemsScreen from '../screens/admin/AdminItemsScreen';
import AdminMembersScreen from '../screens/admin/AdminMembersScreen';
import AdminPlansScreen from '../screens/admin/AdminPlansScreen';
import AdminServicesScreen from '../screens/admin/AdminServicesScreen';
import { useAuth } from '../lib/AuthContext';
import { headerScreenOptions } from './headerStyle';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();
const ICONS = {
  Dashboard: ['view-dashboard-outline', 'view-dashboard'],
  Orders: ['package-variant-closed', 'package-variant'],
  Items: ['tshirt-crew-outline', 'tshirt-crew'],
  Members: ['account-group-outline', 'account-group'],
  Plans: ['crown-outline', 'crown'],
  Services: ['spray-bottle', 'spray-bottle'],
};
const LABELS = { Dashboard: 'Dashboard', Orders: 'Orders', Items: 'Items', Members: 'Members', Plans: 'Plans', Services: 'Services' };

export default function AdminTabs() {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      // 6 tabs (vs. 5 on the customer bar) need a smaller icon/label to avoid crowding.
      tabBar={(props) => <CustomTabBar {...props} icons={ICONS} labels={LABELS} iconSize={20} labelSize={10} />}
      screenOptions={{
        ...headerScreenOptions,
        headerTitle: 'T2 Admin',
        headerRight: () => <IconButton icon="logout" iconColor="#fff" onPress={logout} />,
      }}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Items" component={AdminItemsScreen} />
      <Tab.Screen name="Members" component={AdminMembersScreen} />
      <Tab.Screen name="Plans" component={AdminPlansScreen} />
      <Tab.Screen name="Services" component={AdminServicesScreen} />
    </Tab.Navigator>
  );
}
