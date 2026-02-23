import { Tabs } from 'expo-router';
import { useRef, useEffect } from 'react';
import { Animated, View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/Config';

// --- Animated Tab Bar Button ---
function TabButton({
  label,
  isFocused,
  onPress,
  onLongPress,
  icon,
  colors,
}: {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: React.ReactNode;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabButtonInner, { transform: [{ scale: scaleAnim }] }]}>
        {/* Icon + active pill background */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.primary + '18'],
              }),
            },
          ]}
        >
          {icon}
        </Animated.View>

        {/* Label */}
        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: colorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.tabIconDefault, colors.primary],
              }) as any,
              fontWeight: isFocused ? '600' : '400',
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// --- Custom Tab Bar (fully dynamic — no per-screen changes needed) ---
function CustomTabBar({ state, descriptors, navigation, colors, spacing }: any) {
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background,
          paddingBottom: spacing.BOTTOM_INSET > 0 ? spacing.BOTTOM_INSET : 12,
          borderTopColor: colors.tabIconDefault + '22',
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // Renders whatever icon you passed in tabBarIcon — color & size handled automatically
        const icon = options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? colors.primary : colors.tabIconDefault,
          size: 22,
        });

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TabButton
            key={route.key}
            label={options.title ?? route.name}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            icon={icon}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

// --- Main Layout ---
// To add a new tab: just add a <Tabs.Screen> with a tabBarIcon using any Ionicons name.
// The tab bar adapts automatically — no other changes needed anywhere.
export default function TabLayout() {
  const { colors, spacing } = useAppTheme();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar {...props} colors={colors} spacing={spacing} />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabButtonInner: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
    minWidth: 60,
  },
  iconContainer: {
    width: 46,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
});