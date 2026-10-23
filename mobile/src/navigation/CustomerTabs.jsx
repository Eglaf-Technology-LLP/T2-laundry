import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/customer/HomeScreen';
import ServicesScreen from '../screens/customer/ServicesScreen';
import SubscriptionScreen from '../screens/customer/SubscriptionScreen';
import TrackOrderScreen from '../screens/customer/TrackOrderScreen';
import AccountGate from '../screens/customer/AccountGate';
import AccountHeaderRight from '../screens/customer/AccountHeaderRight';
import { useAuth } from '../lib/AuthContext';
import { headerScreenOptions } from './headerStyle';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: ['home-outline', 'home'],
  Services: ['washing-machine', 'washing-machine'],
  Subscription: ['crown-outline', 'crown'],
  Track: ['map-marker-path', 'map-marker-path'],
  Account: ['account-circle-outline', 'account-circle'],
};
// Short, one-word labels so all 5 tabs read cleanly in the bar — the header
// above each screen still shows the full title (e.g. "T2 Laundry").
const LABELS = { Home: 'Home', Services: 'Services', Subscription: 'Plans', Track: 'Track', Account: 'Account' };

// Logged out, the last tab is the login/sign-up entry point instead.
const GUEST_ICONS = { ...ICONS, Account: ['login', 'login'] };
const GUEST_LABELS = { ...LABELS, Account: 'Login' };

export default function CustomerTabs() {
  const { isAuthenticated } = useAuth();
  const icons = isAuthenticated ? ICONS : GUEST_ICONS;
  const labels = isAuthenticated ? LABELS : GUEST_LABELS;

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} icons={icons} labels={labels} />}
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
      {/* AccountGate sets this tab's header title itself (Account / Log In / Create Account). */}
      <Tab.Screen name="Account" component={AccountGate} options={{ headerRight: AccountHeaderRight }} />
    </Tab.Navigator>
  );
}
