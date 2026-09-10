import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminTabs from './AdminTabs';
import AdminPlanFormScreen from '../screens/admin/AdminPlanFormScreen';
import { headerScreenOptions } from './headerStyle';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, ...headerScreenOptions }}>
      <Stack.Screen name="Tabs" component={AdminTabs} />
      <Stack.Screen name="PlanForm" component={AdminPlanFormScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}
