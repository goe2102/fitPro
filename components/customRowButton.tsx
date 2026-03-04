import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';
// Adjust the import below based on your project's icon library
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

interface CustomRowButtonProps {
  title: string;
  icon_name?: string; // Added icon_name prop
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'ghost' | 'danger';
}

export function CustomRowButton({
  title,
  icon_name,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
}: CustomRowButtonProps) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  // Updated primary background to use colors.card
  const bgColor =
    variant === 'primary'
      ? colors.card
      : variant === 'danger'
        ? colors.error
        : 'transparent';

  // Note: You might want to change '#FFFFFF' to colors.text if your card background is light
  const textColor = variant === 'ghost' ? colors.primary : '#FFFFFF';
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            opacity: isDisabled && !loading ? 0.38 : 1,
            borderWidth: variant === 'ghost' ? 1.5 : 0,
            borderColor: variant === 'ghost' ? colors.primary : 'transparent',
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'ghost' ? colors.primary : '#FFFFFF'}
            size="small"
          />
        ) : (
          <>
            <Text style={[styles.label, { color: textColor }]}>{title}</Text>
            {icon_name && (
              <MaterialIcons
                name={icon_name as any}
                size={20}
                color={textColor}
              />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    minHeight: 54,
    maxHeight: 54,
    borderRadius: 14,
    flexDirection: 'row', // Aligns children horizontally
    alignItems: 'center',
    justifyContent: 'space-between', // Pushes title to left and icon to right
    paddingHorizontal: 20, // Adds breathing room on the left and right edges
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});