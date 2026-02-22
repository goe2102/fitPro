import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Colors = {
  light: {
    primary: '#4A90E2',
    background: '#FFFFFF',
    text: '#1A1A1A',
    card: '#F5F5F5',
    error: '#FF5252',
    tabIconDefault: '#9BA1A6',
  },
  dark: {
    primary: '#4A90E2',
    background: '#121212', // Deep dark
    text: '#ECEDEE',
    card: '#1E1E1E',
    error: '#FF8A80',
    tabIconDefault: '#9BA1A6',
  },
};

export function useAppTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  return {
    colors: Colors[colorScheme],
    spacing: {
      // If the notch is 44px, it adds 20px extra. If no notch, it uses a base 20px.
      GLOBAL_MARGIN_TOP: insets.top > 0 ? insets.top + 10 : 20,
      PADDING_HORIZONTAL: 20,
      BOTTOM_INSET: insets.bottom,
    },
    isDark: colorScheme === 'dark',
  };
}