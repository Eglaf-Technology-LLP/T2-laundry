import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/customer/HomeScreen';
import ServicesScreen from '../screens/customer/ServicesScreen';
import SubscriptionScreen from '../screens/customer/SubscriptionScreen';
import TrackOrderScreen from '../screens/customer/TrackOrderScreen';
import AccountGate from '../screens/customer/AccountGate';
import AccountHeaderRight from '../screens/customer/AccountHeaderRight';
import { headerScreenOptions } from './headerStyle';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

const ICONS = { Home: '🏠', Services: '🧺', Subscription: '👑', Track: '📦', Account: '👤' };
// Short, one-word labels so all 5 tabs read cleanly in the bar — the header
// above each screen still shows the full title (e.g. "T2 Laundry").
const LABELS = { Home: 'Home', Services: 'Services', Subscription: 'Plans', Track: 'Track', Account: 'Account' };

export default function CustomerTabs({ route }) {
  return (
    <Tab.Navigator
      initialRouteName={route.params?.initialTab}
      tabBar={(props) => <CustomTabBar {...props} icons={ICONS} labels={LABELS} />}
      screenOptions={{
        // A real header (rather than headerShown: false) is what makes each
        // screen's content start below the status bar/notch instead of
        // under it — react-navigation's header already accounts for the
        // safe-area top inset, so screens don't each need their own logic.
        ...headerScreenOptions,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'T2 Laundry' }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: 'Services' }} />
      <Tab.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Membership' }} />
      <Tab.Screen name="Track" component={TrackOrderScreen} options={{ title: 'Track Order' }} />
      <Tab.Screen name="Account" component={AccountGate} options={{ title: 'Account', headerRight: AccountHeaderRight }} />
    </Tab.Navigator>
  );
}
