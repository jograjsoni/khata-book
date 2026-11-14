import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, MapPin, Check, Navigation, Plus } from 'lucide-react-native';
import * as Location from 'expo-location';
import { THEME, getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';

interface LocationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { business, updateBusiness, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);
  const [detecting, setDetecting] = useState(false);

  const defaultLocations = [
    'Mumbai, Maharashtra',
    'Pune, Maharashtra',
    'Delhi NCR, New Delhi',
    'Bengaluru, Karnataka',
    'Ahmedabad, Gujarat',
  ];

  const handleSelect = (loc: string) => {
    updateBusiness({ city: loc });
    onClose();
  };

  const handleDetectCurrentLocation = async () => {
    try {
      setDetecting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access in your device settings to detect your store location automatically.',
          [{ text: 'OK' }]
        );
        setDetecting(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        const city = geocode.city || geocode.subregion || geocode.district || 'Current Location';
        const region = geocode.region || geocode.country || '';
        const detectedName = region ? `${city}, ${region}` : city;
        updateBusiness({ city: detectedName });
        onClose();
      } else {
        updateBusiness({ city: 'Detected Location' });
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Location Error', 'Unable to fetch current location. Please select from the list.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconTile, { backgroundColor: colors.bgSecondary }]}>
                <MapPin size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Store Location
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Select or sync current location
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.bgSecondary }]}
            >
              <X size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Current GPS Location Button */}
          <TouchableOpacity
            onPress={handleDetectCurrentLocation}
            disabled={detecting}
            style={[
              styles.detectBtn,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            activeOpacity={0.85}
          >
            {detecting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Navigation size={16} color={colors.primaryForeground} />
            )}
            <Text style={[styles.detectBtnText, { color: colors.primaryForeground }]}>
              {detecting ? 'Detecting GPS Location...' : 'Use Current Device Location'}
            </Text>
          </TouchableOpacity>

          {/* Locations List */}
          <View style={styles.list}>
            {defaultLocations.map((loc) => {
              const isSelected = business.city === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  onPress={() => handleSelect(loc)}
                  style={[
                    styles.locItem,
                    {
                      backgroundColor: isSelected ? colors.bgSecondary : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.locLeft}>
                    <MapPin
                      size={16}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.locText,
                        {
                          color: isSelected ? colors.primary : colors.textPrimary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {loc}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                      <Check size={12} color={colors.primaryForeground} strokeWidth={2.5} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  detectBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  list: {
    gap: 8,
  },
  locItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locText: {
    fontSize: 13,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
