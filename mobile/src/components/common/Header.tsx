import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ArrowLeft, MapPin } from 'lucide-react-native';
import { getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';
import { useRouter } from 'expo-router';
import {
  WireframeCoinIcon,
  WireframeBellIcon,
  WireframeSimpleStarIcon,
  WireframeBookIcon,
} from './WireframeIcons';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showLocation?: boolean;
  showBusinessBrand?: boolean;
  onLocationPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  showLocation = false,
  showBusinessBrand = false,
  onLocationPress,
  rightAction,
}) => {
  const router = useRouter();
  const { business, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCanvas,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.iconButton,
              { backgroundColor: colors.bgSecondary, borderColor: colors.border },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}

        {showBusinessBrand ? (
          /* Settings Variant matching settings.html 0_appbar */
          <View style={styles.brandRow}>
            <View
              style={[
                styles.bookBox,
                { backgroundColor: colors.bgSecondary, borderColor: colors.border },
              ]}
            >
              <WireframeBookIcon size={18} color={colors.textPrimary} />
            </View>
            <TouchableOpacity
              onPress={onLocationPress}
              style={styles.brandTextCol}
              activeOpacity={0.8}
            >
              <View style={styles.brandTitleRow}>
                <Text style={[styles.brandTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {business.name || 'My Khata'}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </View>
              <View style={styles.brandLocationRow}>
                <MapPin size={11} color={colors.textSecondary} />
                <Text style={[styles.brandLocationText, { color: colors.textSecondary }]}>
                  {business.city || 'Set Location'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : showLocation ? (
          /* Home Variant matching home.html 0_appbar */
          <TouchableOpacity
            onPress={onLocationPress}
            style={styles.locationContainer}
            activeOpacity={0.7}
          >
            <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Location</Text>
            <View style={styles.locationTitleRow}>
              <Text style={[styles.locationText, { color: colors.textPrimary }]} numberOfLines={1}>
                {business.city || 'Set Location'}
              </Text>
              <ChevronDown size={14} color={colors.textPrimary} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        ) : (
          /* Standard Title Header (e.g. Financial Reports) */
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.rightRow}>
        {rightAction ? (
          rightAction
        ) : (
          <>
            {/* Rewards / Coin button matching prototype - clean, borderless */}
            <TouchableOpacity
              onPress={() => router.push('/rewards')}
              style={styles.navIconButton}
              activeOpacity={0.7}
              accessibilityLabel="Khata Rewards Coins"
            >
              <WireframeCoinIcon size={20} color="#CA8A04" strokeWidth={1.8} />
            </TouchableOpacity>

            {/* Notifications Bell button matching prototype - clean, borderless */}
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.navIconButton}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <WireframeBellIcon size={20} color={colors.textPrimary} strokeWidth={1.8} />
            </TouchableOpacity>

            {/* Gemini AI Assistant button with Simple Clean Star icon - clean, borderless */}
            <TouchableOpacity
              onPress={() => router.push('/ai-assistant')}
              style={styles.navIconButton}
              activeOpacity={0.7}
              accessibilityLabel="AI Assistant"
            >
              <WireframeSimpleStarIcon size={20} color={colors.textPrimary} strokeWidth={1.8} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  locationContainer: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 14,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bookBox: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  brandLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  brandLocationText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
});
