import React from 'react';
import { IconButton } from 'react-native-paper';
import { useAuth } from '../../lib/AuthContext';

// The Account tab's header action — only meaningful once actually logged
// in; AccountGate shows a login prompt otherwise, so a logout icon there
// would have nothing to log out of.
export default function AccountHeaderRight() {
  const { isAuthenticated, logout } = useAuth();
  if (!isAuthenticated) return null;
  return <IconButton icon="logout" iconColor="#fff" onPress={logout} />;
}
