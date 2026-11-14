import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Pressable, Alert } from 'react-native';
import { X, QrCode, Share2, Download, CheckCircle2 } from 'lucide-react-native';
import QRCodeSvg from 'react-native-qrcode-svg';
import { THEME } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';

interface QrCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ visible, onClose }) => {
  const { business, isDarkMode } = useKhataStore();

  const effectiveUpiId = business.upiId || 'merchant@upi';
  const effectiveStoreName = business.name || 'My Khata';

  const upiPayload = `upi://pay?pa=${effectiveUpiId}&pn=${encodeURIComponent(
    effectiveStoreName
  )}&cu=INR`;

  const handleShare = () => {
    Alert.alert('Share QR Code', `UPI ID: ${effectiveUpiId}\nStore: ${effectiveStoreName}\nReady to accept zero-fee instant settlements.`);
  };

  const handleDownload = () => {
    Alert.alert('Downloaded', 'Store QR code poster has been saved to your device gallery for printing.');
  };

  const bg = isDarkMode ? THEME.colors.dark.bgCard : '#FFFFFF';
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.borderLight;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: bg }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderBottomColor: border }]}>
            <View style={styles.headerLeft}>
              <QrCode size={20} color={THEME.colors.primary} />
              <Text style={[styles.title, { color: textPrimary }]}>Store Payment QR</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
            >
              <X size={18} color={textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Store Badge */}
            <View style={styles.storeBadge}>
              <Text style={styles.storeName}>{effectiveStoreName}</Text>
              <Text style={styles.storeCity}>{business.city || 'All UPI Apps'}</Text>
              <View style={styles.verifiedRow}>
                <CheckCircle2 size={13} color={THEME.colors.success} />
                <Text style={styles.verifiedText}>Verified Merchant QR</Text>
              </View>
            </View>

            {/* QR Container */}
            <View style={styles.qrContainer}>
              <QRCodeSvg
                value={upiPayload}
                size={200}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* UPI ID display */}
            <View style={[styles.upiBox, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
              <Text style={[styles.upiLabel, { color: textMuted }]}>UPI ID for Direct Transfers</Text>
              <Text style={[styles.upiText, { color: textPrimary }]}>{business.upiId || 'Configure in Payment Settings'}</Text>
            </View>

            {/* Accepted Methods */}
            <Text style={[styles.acceptedText, { color: textMuted }]}>
              Accepts GPay, PhonePe, Paytm, BHIM & all UPI apps
            </Text>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleShare}
                style={[styles.actionBtn, { backgroundColor: THEME.colors.primaryBg, borderColor: THEME.colors.primaryBorder }]}
                activeOpacity={0.8}
              >
                <Share2 size={16} color={THEME.colors.primary} />
                <Text style={[styles.actionBtnText, { color: THEME.colors.primary }]}>Share QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDownload}
                style={[styles.actionBtn, { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary }]}
                activeOpacity={0.8}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  storeBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  storeCity: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 14,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  upiBox: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  upiLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  upiText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  acceptedText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
