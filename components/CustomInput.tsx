import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { useAppTheme } from '../constants/Config';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function CustomInput({ label, error, style, ...props }: CustomInputProps) {
  const { colors } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasContent = !!props.value;

  // Always start at 0 — never touch useNativeDriver: true on this node
  const anim = useRef(new Animated.Value(0)).current;

  const animate = (toValue: number) => {
    anim.stopAnimation();
    Animated.timing(anim, {
      toValue,
      duration: 160,
      useNativeDriver: false,
    }).start();
  };

  // Sync on mount if field already has a value (e.g. autofill)
  useEffect(() => {
    if (hasContent || isFocused) {
      anim.setValue(1);
    }
  }, []);

  // React to value changes (typing / clearing)
  useEffect(() => {
    if (hasContent) {
      animate(1);
    } else if (!isFocused) {
      animate(0);
    }
  }, [hasContent]);

  const handleFocus = () => {
    setIsFocused(true);
    animate(1);
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!hasContent) animate(0);
    props.onBlur?.({} as any);
  };

  const placeholderOpacity = anim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const borderLabelOpacity = anim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.wrapper}>
      {/* Small label that sits on the top border line when raised */}
      <Animated.Text
        style={[
          styles.borderLabel,
          {
            color: isFocused ? colors.primary : colors.tabIconDefault,
            opacity: borderLabelOpacity,
            backgroundColor: colors.background,
          },
        ]}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderColor: isFocused ? colors.primary : 'transparent',
            borderWidth: 1.5,
          },
        ]}
      >
        {/* Centered placeholder — vanishes as soon as you tap in */}
        <Animated.Text
          style={[
            styles.placeholder,
            {
              color: colors.tabIconDefault,
              opacity: placeholderOpacity,
            },
          ]}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>

        <TextInput
          ref={inputRef}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor="transparent"
          selectionColor={colors.primary}
        />
      </View>

      {!!error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  borderLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    zIndex: 2,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    paddingHorizontal: 3,
  },
  inputContainer: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  placeholder: {
    position: 'absolute',
    left: 16,
    right: 16,
    fontSize: 16,
    letterSpacing: 0.1,
    textAlign: 'left',
  },
  input: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 0.2,
    textAlignVertical: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    letterSpacing: 0.1,
  },
});