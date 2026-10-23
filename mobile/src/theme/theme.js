import { MD3LightTheme } from 'react-native-paper';
import { colors } from './tokens';

// Paper's defaults (purple primary, tight corners) mapped onto the T2 brand
// tokens, so every Button/TextInput/Chip/Modal picks up the same look without
// each screen overriding colors.
export const theme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.navy,
    onPrimary: colors.onDark,
    primaryContainer: colors.navySoft,
    onPrimaryContainer: colors.navy,
    secondary: colors.cyanDark,
    secondaryContainer: colors.cyanSoft,
    onSecondaryContainer: colors.navy,
    background: colors.bg,
    surface: colors.surface,
    surfaceVariant: colors.surfaceMuted,
    outline: colors.borderStrong,
    outlineVariant: colors.border,
    error: colors.error,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level2: colors.surface,
    },
  },
};
