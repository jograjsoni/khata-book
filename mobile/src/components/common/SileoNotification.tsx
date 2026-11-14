import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, Bell, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useKhataStore } from '../../store/useKhataStore';
import { FONTS, getThemeColors, THEME } from '../../theme/theme';

export type SileoType = 'success' | 'error' | 'info' | 'warning';

interface SileoToastState {
  visible: boolean;
  title: string;
  message: string;
  type: SileoType;
  duration?: number;
  show: (options: { title: string; message: string; type?: SileoType; duration?: number }) => void;
  hide: () => void;
}

export const useSileoStore = create<SileoToastState>((set) => ({
  visible: false,
  title: '',
  message: '',
  type: 'success',
  duration: 3500,
  show: ({ title, message, type = 'success', duration = 3500 }) => {
    set({
      visible: true,
      title,
      message,
      type,
      duration,
    });
  },
  hide: () => {
    set({ visible: false });
  },
}));

/**
 * Public helper to trigger Sileo notifications anywhere in the app
 */
export const sileo = {
  success: (title: string, message: string, duration?: number) => {
    useSileoStore.getState().show({ title, message, type: 'success', duration });
  },
  error: (title: string, message: string, duration?: number) => {
    useSileoStore.getState().show({ title, message, type: 'error', duration });
  },
  info: (title: string, message: string, duration?: number) => {
    useSileoStore.getState().show({ title, message, type: 'info', duration });
  },
  warning: (title: string, message: string, duration?: number) => {
    useSileoStore.getState().show({ title, message, type: 'warning', duration });
  },
};

const { width } = Dimensions.get('window');

/**
 * Sileo Notification Component
 * Features:
 * - Fluid spring dynamics matching Sileo physics
 * - Dynamic light/dark theme adaptation
 * - Tactile micro-haptic feedback
 * - Interactive tap-to-dismiss
 */
export function SileoNotification() {
  const { isDarkMode } = useKhataStore();
  const theme = getThemeColors(isDarkMode);
  const { visible, title, message, type, duration, hide } = useSileoStore();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    if (visible) {
      // Sileo Spring entrance physics
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 85,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 7,
          tension: 85,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismiss();
      }, duration || 3500);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      translateYAnim.setValue(-24);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -18,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hide();
    });
  };

  if (!visible) return null;

  const typeColors = {
    success: {
      bg: theme.successBg,
      border: theme.successBorder,
      icon: theme.success,
    },
    error: {
      bg: theme.destructiveBg,
      border: theme.destructiveBorder,
      icon: theme.destructive,
    },
    warning: {
      bg: theme.warningBg,
      border: theme.warningBorder,
      icon: theme.warning,
    },
    info: {
      bg: theme.infoBg,
      border: theme.infoBorder,
      icon: theme.info,
    },
  }[type];

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.sileoCard,
          {
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            ...THEME.shadows.lg,
          },
        ]}
      >
        {/* Left Icon Pill */}
        <View style={[styles.iconCircle, { backgroundColor: typeColors.bg }]}>
          {type === 'success' && <CheckCircle2 size={18} color={typeColors.icon} strokeWidth={2.5} />}
          {type === 'error' && <AlertCircle size={18} color={typeColors.icon} strokeWidth={2.5} />}
          {type === 'warning' && <Bell size={18} color={typeColors.icon} strokeWidth={2.5} />}
          {type === 'info' && <Info size={18} color={typeColors.icon} strokeWidth={2.5} />}
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.sileoTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {!!message && (
            <Text style={[styles.sileoMessage, { color: theme.textSecondary }]} numberOfLines={2}>
              {message}
            </Text>
          )}
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={15} color={theme.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    paddingHorizontal: 16,
  },
  sileoCard: {
    width: Math.min(width - 32, 420),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sileoTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  sileoMessage: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 14,
  },
});
