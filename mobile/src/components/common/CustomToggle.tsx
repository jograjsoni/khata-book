import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Custom animated toggle switch
 * OFF: Smooth soft red track with crisp red thumb (#ef4444)
 * ON: Smooth soft green track with crisp vibrant green thumb (#16a34a)
 */
export const CustomToggle: React.FC<CustomToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fee2e2', '#dcfce7'],
  });

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fca5a5', '#86efac'],
  });

  const thumbColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ef4444', '#16a34a'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[style, { opacity: disabled ? 0.45 : 1 }]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              backgroundColor: thumbColor,
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 3,
  },
});
