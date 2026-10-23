import { colors } from '../theme/tokens';

// Single source of truth for header look — navy brand header shared by every
// navigator instead of each one picking its own colors.
export const NAVY = colors.navy;
export const GOLD = colors.gold;

export const headerScreenOptions = {
  headerStyle: { backgroundColor: NAVY },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: 0.2 },
  headerTitleAlign: 'center',
  // A flat navy header reads cleaner than one with a stray shadow line under it.
  headerShadowVisible: false,
};

// The tab bar itself is a fully custom component (see CustomTabBar.jsx),
// passed via the Navigator's `tabBar` prop, rather than styled through
// tabBarStyle/tabBarIcon/tabBarButton — those clip their content to fixed
// sizes meant for an icon alone, which kept cutting off the label.
