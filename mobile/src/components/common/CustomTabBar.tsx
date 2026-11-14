import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getThemeColors, FONTS, THEME } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  WireframeTabHome,
  WireframeTabReports,
  WireframeTabSettings,
} from './WireframeIcons';

interface CustomTabBarProps {
  state: any;
  descriptors?: any;
  navigation?: any;
  emitter?: any;
  navigateToTab?: (routeKey: string) => void;
  insets?: any;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  navigation,
  navigateToTab,
}) => {
  const router = useRouter();
  const safeInsets = useSafeAreaInsets();
  const { isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  // 3 Tabs matching wireframe: Home, Reports, Settings
  const tabs = [
    { name: 'index', path: '/(tabs)', label: 'Home', icon: WireframeTabHome },
    { name: 'reports', path: '/(tabs)/reports', label: 'Reports', icon: WireframeTabReports },
    { name: 'settings', path: '/(tabs)/settings', label: 'Settings', icon: WireframeTabSettings },
  ];

  const activeIndex = state?.index ?? 0;

  // Individual tab scale springs for tactile bounce
  const tabScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const bottomOffset = Math.max(safeInsets.bottom, 12);

  return (
    <View
      style={[
        styles.floatingWrapper,
        {
          bottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            ...THEME.shadows.md,
          },
        ]}
      >
        {tabs.map((tab, index) => {
          const isFocused = activeIndex === index;

          const onPress = () => {
            Animated.sequence([
              Animated.timing(tabScales[index], {
                toValue: 0.88,
                duration: 70,
                useNativeDriver: true,
              }),
              Animated.spring(tabScales[index], {
                toValue: 1,
                friction: 5,
                tension: 150,
                useNativeDriver: true,
              }),
            ]).start();

            if (navigation?.emit) {
              const event = navigation.emit({
                type: 'tabPress',
                target: state?.routes?.[index]?.key,
                canPreventDefault: true,
              });
              if (isFocused || event?.defaultPrevented) return;
            }

            if (navigation?.navigate) {
              navigation.navigate(tab.name);
            } else if (navigateToTab && state?.routes?.[index]?.key) {
              navigateToTab(state.routes[index].key);
            } else {
              router.push(tab.path as any);
            }
          };

          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={`${tab.label} Tab`}
              testID={`tab-${tab.name}`}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabInner,
                  {
                    transform: [{ scale: tabScales[index] }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCapsule,
                    {
                      backgroundColor: isFocused
                        ? colors.navActivePill
                        : 'transparent',
                    },
                  ]}
                >
                  <IconComponent
                    size={20}
                    color={isFocused ? colors.textPrimary : colors.textSecondary}
                    strokeWidth={1.8}
                    filled={isFocused}
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? colors.textPrimary : colors.textSecondary,
                      fontFamily: isFocused ? FONTS.bold : FONTS.medium,
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  pillContainer: {
    width: '100%',
    height: 60,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCapsule: {
    minWidth: 54,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.1,
  },
});
