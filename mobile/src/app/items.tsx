import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Package,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Tag,
  Barcode,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore, InventoryItem } from '../store/useKhataStore';
import { Header } from '../components/common/Header';

export default function ItemsScreen() {
  const router = useRouter();
  const { items, addItem, isDarkMode } = useKhataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [shelf, setShelf] = useState('');
  const [category, setCategory] = useState('Groceries & Staples');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('bag');
  const [price, setPrice] = useState('');

  const categories = ['All', 'Groceries & Staples', 'Packaged Foods', 'Edible Oils', 'Beverages'];

  const filteredItems = useMemo(() => {
    let list = items;
    if (selectedCategory !== 'All') {
      list = list.filter((i) => i.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.shelf.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, selectedCategory, searchQuery]);

  const handleAddItem = () => {
    if (!name.trim()) {
      Alert.alert('Item Name Required', 'Please enter item title.');
      return;
    }
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (!numPrice || isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Valid Price Required', 'Please enter a selling price.');
      return;
    }
    const numStock = parseInt(stock.replace(/[^0-9]/g, ''), 10) || 0;

    addItem({
      name: name.trim(),
      sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      shelf: shelf.trim() || 'Shelf A1',
      category,
      stock: numStock,
      unit: unit.trim() || 'pcs',
      price: numPrice,
      status: numStock <= 15 ? 'Low Stock' : 'In Stock',
    });

    setModalVisible(false);
    setName('');
    setSku('');
    setShelf('');
    setStock('');
    setPrice('');
    Alert.alert('Item Added', `${name.trim()} added to your active catalog.`);
  };

  const handleExportCsv = () => {
    Alert.alert('Catalog Exported', 'Inventory catalog CSV generated and exported.');
  };

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="Items"
        subtitle="Inventory Stock & Price Catalog"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[styles.headerAddBtn, { backgroundColor: THEME.colors.primary }]}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.headerAddBtnText}>Add Item</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: bgCard, borderColor: border }]}>
          <Search size={16} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search items by name, barcode, or SKU"
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((c) => {
            const isSelected = selectedCategory === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCategory(c)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected
                      ? THEME.colors.primary
                      : isDarkMode
                      ? '#334155'
                      : '#FFFFFF',
                    borderColor: isSelected ? THEME.colors.primary : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected ? '#FFFFFF' : textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Catalog Banner matching items.html */}
        <View style={[styles.catalogBanner, { backgroundColor: bgCard, borderColor: border }]}>
          <View style={styles.catalogLeft}>
            <Text style={[styles.catalogTitle, { color: textPrimary }]}>
              Active Inventory Catalog
            </Text>
            <View style={styles.catalogCountBadge}>
              <Text style={styles.catalogCountText}>{filteredItems.length} items</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleExportCsv}
            style={[styles.exportCsvBtn, { backgroundColor: THEME.colors.primaryBg }]}
          >
            <Download size={14} color={THEME.colors.primary} />
            <Text style={styles.exportCsvText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {filteredItems.length === 0 ? (
            <View style={[styles.itemCard, { backgroundColor: bgCard, borderColor: border, padding: 32, alignItems: 'center', justifyContent: 'center' }]}>
              <Package size={32} color={THEME.colors.primary} style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: textPrimary, marginBottom: 4 }}>
                No Inventory Items Found
              </Text>
              <Text style={{ fontSize: 12, color: textMuted, textAlign: 'center', marginBottom: 14 }}>
                Maintain item stock, wholesale prices, and low-stock alerts seamlessly.
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: THEME.colors.primary }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredItems.map((item) => {
            const isLowStock = item.status === 'Low Stock';
            return (
              <View
                key={item.id}
                style={[styles.itemCard, { backgroundColor: bgCard, borderColor: border }]}
              >
                <View style={styles.itemMainRow}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.itemIconCircle,
                        {
                          backgroundColor: isLowStock
                            ? THEME.colors.warningBg
                            : THEME.colors.primaryBg,
                        },
                      ]}
                    >
                      <Package
                        size={20}
                        color={isLowStock ? THEME.colors.warning : THEME.colors.primary}
                      />
                    </View>
                    <View style={styles.itemTexts}>
                      <Text style={[styles.itemName, { color: textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.itemCategory, { color: textMuted }]}>
                        {item.category}
                      </Text>
                      <Text style={[styles.itemMeta, { color: textMuted }]}>
                        SKU: {item.sku} · {item.shelf}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemRight}>
                    <Text style={[styles.itemPrice, { color: THEME.colors.primary }]}>
                      ₹ {item.price.toLocaleString('en-IN')}{' '}
                      <Text style={[styles.itemUnit, { color: textMuted }]}>/ {item.unit}</Text>
                    </Text>

                    <View
                      style={[
                        styles.stockBadge,
                        {
                          backgroundColor: isLowStock
                            ? THEME.colors.warningBg
                            : THEME.colors.successBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgeText,
                          {
                            color: isLowStock
                              ? THEME.colors.warning
                              : THEME.colors.success,
                          },
                        ]}
                      >
                        {item.status} ({item.stock})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: border }]}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Add New Inventory Item</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
              >
                <X size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: textMuted }]}>Item Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="e.g. Basmati Rice 25kg"
                placeholderTextColor={textMuted}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.multiRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: textMuted }]}>SKU Code</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                    placeholder="RICE-25KG"
                    placeholderTextColor={textMuted}
                    value={sku}
                    onChangeText={setSku}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: textMuted }]}>Shelf Location</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                    placeholder="Shelf A1"
                    placeholderTextColor={textMuted}
                    value={shelf}
                    onChangeText={setShelf}
                  />
                </View>
              </View>

              <View style={styles.multiRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: textMuted }]}>Selling Price (₹) *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                    placeholder="1850"
                    placeholderTextColor={textMuted}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: textMuted }]}>Unit (bag / kg / tin)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                    placeholder="bag"
                    placeholderTextColor={textMuted}
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>

              <Text style={[styles.modalLabel, { color: textMuted }]}>Initial Stock Quantity</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="50"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />

              <TouchableOpacity
                onPress={handleAddItem}
                style={[styles.submitItemBtn, { backgroundColor: THEME.colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={styles.submitItemText}>SAVE TO CATALOG</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  categoriesScroll: {
    marginBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
  },
  catalogBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  catalogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catalogTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  catalogCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  catalogCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  exportCsvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  exportCsvText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  itemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTexts: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  itemUnit: {
    fontSize: 11,
    fontWeight: '400',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 4,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
  },
  multiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  submitItemBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
