// Bottom tabs live inside the root stack's 'Tabs' route. From a pushed stack
// screen (Cart, Login, Signup) a plain navigate('Track') isn't handled —
// react-navigation v7 doesn't route by name into a child navigator — so pop
// back to 'Tabs' and open the tab there. Also closes the pushed screen, so
// Back from the tab doesn't return to it.
export const TAB_NAMES = ['Home', 'Services', 'Subscription', 'Track', 'Account'];

export function goToTab(navigation, tab, params) {
  navigation.popTo('Tabs', { screen: tab, params });
}
