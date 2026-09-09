// Single source of truth for header look — matches the web app's navy/gold
// brand pair instead of each navigator picking its own header colors.
export const NAVY = '#0E2346';
export const GOLD = '#D4AF37';

export const headerScreenOptions = {
  headerStyle: { backgroundColor: NAVY, borderBottomWidth: 2, borderBottomColor: GOLD },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  // The default header shadow/elevation reads as a stray gray line under a
  // dark header — swap it for the deliberate gold border above instead.
  headerShadowVisible: false,
};

// The tab bar itself is a fully custom component (see CustomTabBar.jsx),
// passed via the Navigator's `tabBar` prop, rather than styled through
// tabBarStyle/tabBarIcon/tabBarButton — those clip their content to fixed
// sizes meant for an icon alone, which kept cutting off the label.
