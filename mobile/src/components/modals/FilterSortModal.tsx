import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';
import { ScalePressable } from '../common/ScalePressable';

interface FilterSortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string;
  selectedSort: string;
  onApply: (filter: string, sort: string) => void;
}

export const FilterSortModal: React.FC<FilterSortModalProps> = ({
  visible,
  onClose,
  selectedFilter,
  selectedSort,
  onApply,
}) => {
  const { isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [activeFilter, setActiveFilter] = useState(selectedFilter || 'All');
  const [activeSort, setActiveSort] = useState(selectedSort || 'Most Recent');

  useEffect(() => {
    if (visible) {
      setActiveFilter(selectedFilter || 'All');
      setActiveSort(selectedSort || 'Most Recent');
    }
  }, [visible, selectedFilter, selectedSort]);

  const filterChips = [
    'All',
    'You will get',
    'You will give',
    'Settled',
    'Due Today',
    'Upcoming',
    'No Due Date',
  ];

  const sortOptions = [
    'Most Recent',
    'Highest Amount',
    'By Name (A-Z)',
    'Oldest',
    'Least Amount',
  ];

  const handleApply = () => {
    onApply(activeFilter, activeSort);
    onClose();
  };

  const handleReset = () => {
    setActiveFilter('All');
    setActiveSort('Most Recent');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.panel,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Grab Handle */}
          <View style={[styles.grabHandle, { backgroundColor: colors.borderStrong }]} />

          {/* Header Row: Title & Close Button */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Filter & Sort</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Filter Chips Horizontal Bar */}
          <View style={styles.chipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {filterChips.map((chip) => {
                const isSelected = activeFilter === chip;
                return (
                  <ScalePressable
                    key={chip}
                    onPress={() => setActiveFilter(chip)}
                    style={[
                      styles.filterChip,
                      isSelected
                        ? [
                            styles.filterChipActive,
                            {
                              backgroundColor: colors.textPrimary,
                              borderColor: colors.textPrimary,
                            },
                          ]
                        : [
                            styles.filterChipInactive,
                            {
                              backgroundColor: colors.bgSecondary,
                              borderColor: colors.border,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? colors.bgCard : colors.textPrimary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {chip}
                    </Text>
                  </ScalePressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Sort Order Radio List */}
          <View style={styles.sortListSection}>
            {sortOptions.map((opt, idx) => {
              const isSelected = activeSort === opt;
              const isLast = idx === sortOptions.length - 1;
              return (
                <View key={opt}>
                  <TouchableOpacity
                    onPress={() => setActiveSort(opt)}
                    style={styles.sortItem}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.sortTitle,
                        {
                          color: colors.textPrimary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.regular,
                        },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>

                  {!isLast && (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: colors.borderLight },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Bottom Action Bar */}
          <View
            style={[
              styles.actionBar,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.bgCard,
              },
            ]}
          >
            <ScalePressable
              onPress={handleReset}
              style={[
                styles.resetBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.bgSecondary,
                },
              ]}
            >
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
            </ScalePressable>

            <ScalePressable
              onPress={handleApply}
              style={[
                styles.applyBtn,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.applyText, { color: colors.primaryForeground }]}>VIEW RESULT</Text>
            </ScalePressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  panel: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsContainer: {
    paddingVertical: 8,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {},
  filterChipInactive: {},
  filterChipText: {
    fontSize: 13,
  },
  sortListSection: {
    paddingVertical: 4,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sortTitle: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginLeft: 48,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});
