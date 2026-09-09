import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from './src/lib/queryClient';
import { AuthProvider } from './src/lib/AuthContext';
import { CartProvider } from './src/lib/CartContext';
import { theme } from './src/theme/theme';
import RootNavigator from './src/navigation/RootNavigator';

const NAVY = '#0E2346';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QueryClientProvider client={queryClientInstance}>
          <AuthProvider>
            <CartProvider>
              {/* Every screen header is navy, so the status bar icons should
                  always be light — following the device's light/dark mode
                  here (as before) put dark icons on a dark header and made
                  them unreadable. */}
              <StatusBar barStyle="light-content" backgroundColor={NAVY} />
              <RootNavigator />
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
