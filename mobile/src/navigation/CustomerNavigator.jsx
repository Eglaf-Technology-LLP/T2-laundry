import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomerTabs from './CustomerTabs';
import LoginScreen from '../screens/customer/LoginScreen';
import SignupScreen from '../screens/customer/SignupScreen';
import CartScreen from '../screens/customer/CartScreen';
import { headerScreenOptions } from './headerStyle';

const Stack = createNativeStackNavigator();

export default function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, ...headerScreenOptions }}>
      <Stack.Screen name="Tabs" component={CustomerTabs} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Log In' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: true, title: 'Sign Up' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'Your Order' }} />
    </Stack.Navigator>
  );
}
