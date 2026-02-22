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
import { useAppTheme } from '../constants/Config';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'ghost' | 'danger';
}

export function CustomButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
}: CustomButtonProps) {
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

  const bgColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.error
        : 'transparent';

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
          <Text style={[styles.label, { color: textColor }]}>{title}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});