import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ScalePressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticFeedback?: boolean;
}

/**
 * Micro-interaction wrapper providing spring-physics scale and tactile haptics.
 * Uses AnimatedPressable to unify press handling, hit testing, and layout styles.
 */
export function ScalePressable({
  children,
  style,
  scaleTo = 0.965,
  hapticFeedback = false,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: ScalePressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();

    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();

    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        { transform: [{ scale: scaleAnim }] },
      ]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
