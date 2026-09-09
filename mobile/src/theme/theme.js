import { MD3LightTheme } from 'react-native-paper';

// Matches the web app's slate/dark accent look (see ProtectedRoute's
// border-slate-800 spinner) rather than Paper's default purple.
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1e293b',
    secondary: '#334155',
    background: '#f8fafc',
    surface: '#ffffff',
    error: '#dc2626',
  },
};
