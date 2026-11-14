import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
  Bell,
  Phone,
  MessageSquare,
  Camera,
  Mic,
  Users,
  MapPin,
  Fingerprint,
  Activity,
  Wifi,
  Smartphone,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { ScalePressable } from '../components/common/ScalePressable';
import { sileo } from '../components/common/SileoNotification';
import permissionService, { AllPermissionsReport } from '../services/permissionService';

export default function PermissionsScreen() {
  const router = useRouter();
  const { isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [loading, setLoading] = useState(true);
  const [grantingAll, setGrantingAll] = useState(false);
  const [report, setReport] = useState<AllPermissionsReport | null>(null);

  // Live test result states
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [locationResult, setLocationResult] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    accuracy?: number | null;
  } | null>(null);
  const [testingGps, setTestingGps] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<string | null>(null);

  const loadPermissionsStatus = useCallback(async () => {
    try {
      setLoading(true);
      const rep = await permissionService.getAllPermissionsStatus();
      setReport(rep);
    } catch (err) {
      console.warn('[permissions] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissionsStatus();
  }, [loadPermissionsStatus]);

  const handleGrantAll = async () => {
    try {
      setGrantingAll(true);
      await permissionService.triggerVibration('medium');
      await permissionService.requestAllPermissions();
      await loadPermissionsStatus();
      sileo.success(
        'Permissions Updated',
        'Real device permissions were requested and refreshed.'
      );
    } catch {
      sileo.info('Permission Request', 'Completed device permissions sequence.');
    } finally {
      setGrantingAll(false);
    }
  };

  const handleTestNotification = async () => {
    await permissionService.triggerVibration('light');
    const sent = await permissionService.sendRealTestNotification(
      'Khata Ledger Alert',
      'Instant real-time transaction notification is active on your device.'
    );
    if (sent) {
      sileo.success(
        'Push Notification Sent',
        'Check your Android/iOS notification drawer above!'
      );
    } else {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notifications in system settings to receive instant alerts.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
      );
    }
    loadPermissionsStatus();
  };

  const handleTestBiometrics = async () => {
    await permissionService.triggerVibration('medium');
    const res = await permissionService.authenticateWithBiometrics(
      'Authenticate with Fingerprint or Face ID'
    );
    if (res.success) {
      await permissionService.triggerVibration('success');
      sileo.success(
        'Biometrics Verified',
        'Fingerprint/Face ID hardware authenticated successfully.'
      );
    } else {
      await permissionService.triggerVibration('error');
      Alert.alert('Biometrics Status', res.error || 'Authentication canceled or not recognized.');
    }
  };

  const handleTestContacts = async () => {
    await permissionService.triggerVibration('light');
    const granted = await permissionService.requestContactsPermission();
    if (granted) {
      const count = await permissionService.getDeviceContactsCount();
      setContactCount(count);
      sileo.success(
        'Contacts Loaded',
        `Successfully queried ${count} phone contacts from your device.`
      );
    } else {
      Alert.alert(
        'Contacts Permission Denied',
        'Allow contacts access to import your customer addresses and phone numbers.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
      );
    }
    loadPermissionsStatus();
  };

  const handleTestGps = async () => {
    try {
      setTestingGps(true);
      await permissionService.triggerVibration('light');
      const loc = await permissionService.getRealCurrentLocation();
      if (loc) {
        setLocationResult(loc);
        sileo.success(
          'Location Fixed',
          `GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} (${loc.city || 'Found'})`
        );
      } else {
        Alert.alert('Location Access', 'Could not obtain location. Please ensure GPS is turned on.');
      }
    } finally {
      setTestingGps(false);
      loadPermissionsStatus();
    }
  };

  const handleTestCamera = async () => {
    await permissionService.triggerVibration('light');
    const granted = await permissionService.requestCameraPermission();
    if (granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        sileo.success(
          'Camera Capture Ready',
          'Photo captured and verified via real device camera.'
        );
      }
    } else {
      Alert.alert(
        'Camera Permission Denied',
        'Allow camera access to capture paper bills and payment proofs.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
      );
    }
    loadPermissionsStatus();
  };

  const handleTestMicrophone = async () => {
    await permissionService.triggerVibration('light');
    const granted = await permissionService.requestMicrophonePermission();
    if (granted) {
      sileo.success(
        'Microphone Ready',
        'Microphone hardware access granted for voice transaction memos.'
      );
    } else {
      Alert.alert(
        'Microphone Permission Denied',
        'Allow microphone access to record voice transaction memos.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
      );
    }
    loadPermissionsStatus();
  };

  const handleTestVibration = async () => {
    await permissionService.triggerVibration('heavy');
    sileo.success('Haptic Vibration', 'Device vibration motor triggered successfully.');
  };

  const handleTestNetwork = async () => {
    const net = await permissionService.getNetworkDetails();
    const str = `${net.type.toUpperCase()} | Connected: ${net.isConnected ? 'Yes' : 'No'} | Internet: ${
      net.isInternetReachable ? 'Reachable' : 'Checking'
    }`;
    setNetworkInfo(str);
    sileo.info('Network Verified', str);
  };

  const renderStatusBadge = (isGranted: boolean | 'granted' | 'denied' | 'undetermined' | 'unavailable') => {
    const granted = isGranted === true || isGranted === 'granted';
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: granted ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            borderColor: granted ? '#16a34a' : '#ef4444',
          },
        ]}
      >
        {granted ? (
          <CheckCircle2 size={12} color="#16a34a" strokeWidth={2.5} />
        ) : (
          <AlertCircle size={12} color="#ef4444" strokeWidth={2.5} />
        )}
        <Text
          style={[
            styles.badgeText,
            { color: granted ? '#16a34a' : '#ef4444', fontFamily: FONTS.semiBold },
          ]}
        >
          {granted ? 'Allowed' : 'Not Allowed'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* App Bar */}
      <View style={[styles.appBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.bgSecondary }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.appBarTitleCol}>
          <Text style={[styles.appBarTitle, { color: colors.textPrimary }]}>
            Permissions & Hardware
          </Text>
          <Text style={[styles.appBarSub, { color: colors.textSecondary }]}>
            Real Device Capabilities & System Access
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadPermissionsStatus}
          style={[styles.iconBtn, { backgroundColor: colors.bgSecondary }]}
        >
          <RefreshCw size={17} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Banner */}
        <View
          style={[
            styles.masterBanner,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.bannerRow}>
            <View style={[styles.bannerIconBox, { backgroundColor: colors.primary }]}>
              <ShieldCheck size={24} color={colors.primaryForeground} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                Real Device Authorization
              </Text>
              <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
                These permissions govern live hardware, contacts sync, camera billing, push alerts, and direct telephony on this phone.
              </Text>
            </View>
          </View>

          <ScalePressable
            onPress={handleGrantAll}
            disabled={grantingAll}
            style={[styles.grantAllBtn, { backgroundColor: colors.primary }]}
          >
            {grantingAll ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Sparkles size={16} color={colors.primaryForeground} />
                <Text style={[styles.grantAllBtnText, { color: colors.primaryForeground }]}>
                  Grant All Real Permissions
                </Text>
              </>
            )}
          </ScalePressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Auditing device hardware and security permissions...
            </Text>
          </View>
        ) : (
          <>
            {/* ── Category 1: Nearby Devices & Bluetooth ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Radio size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Nearby Devices & Bluetooth
                </Text>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    access local network devices
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    NEARBY_WIFI_DEVICES & Local Subnet Discovery
                  </Text>
                </View>
                {renderStatusBadge(report?.nearbyDevices.localNetwork || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    connect to paired Bluetooth devices
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    BLUETOOTH_CONNECT for thermal receipt printers & POS
                  </Text>
                </View>
                {renderStatusBadge(report?.nearbyDevices.bluetoothConnect || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    discover and pair nearby Bluetooth devices
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    BLUETOOTH_SCAN for nearby merchant POS terminals
                  </Text>
                </View>
                {renderStatusBadge(report?.nearbyDevices.bluetoothScan || 'undetermined')}
              </View>

              <TouchableOpacity
                onPress={() => permissionService.requestBluetoothPermissions().then(loadPermissionsStatus)}
                style={[styles.actionBtnRow, { backgroundColor: colors.bgSecondary }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Authorize Bluetooth & Local Network
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Category 2: Notifications ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Bell size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Notifications
                </Text>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    show notifications
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    POST_NOTIFICATIONS for payment alerts & credit reminders
                  </Text>
                </View>
                {renderStatusBadge(report?.notifications.postNotifications || 'undetermined')}
              </View>

              <View style={styles.btnRowDouble}>
                <TouchableOpacity
                  onPress={() => permissionService.requestNotificationPermission().then(loadPermissionsStatus)}
                  style={[styles.halfBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Authorize</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTestNotification}
                  style={[styles.halfBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                    Test Push Alert
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Category 3: Phone & Telephony ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Phone size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Phone & Telephony
                </Text>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    read phone numbers
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    READ_PHONE_NUMBERS for SIM identity verification
                  </Text>
                </View>
                {renderStatusBadge(report?.phone.readPhoneNumbers || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    read phone status and identity
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    READ_PHONE_STATE for telephony and network handover
                  </Text>
                </View>
                {renderStatusBadge(report?.phone.readPhoneState || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    directly call phone numbers
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    CALL_PHONE for one-tap calling to customers and suppliers
                  </Text>
                </View>
                {renderStatusBadge(report?.phone.callPhone || 'undetermined')}
              </View>

              <TouchableOpacity
                onPress={() => permissionService.directCall('198')}
                style={[styles.actionBtnRow, { backgroundColor: colors.bgSecondary }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Authorize & Test Phone Dialer
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Category 4: SMS Messages ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <MessageSquare size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  SMS Messages
                </Text>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    read your text messages (SMS or MMS)
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    READ_SMS for automatic bank and payment OTP parsing
                  </Text>
                </View>
                {renderStatusBadge(report?.sms.readSms || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    receive text messages (SMS)
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    RECEIVE_SMS for instant incoming payment SMS alerts
                  </Text>
                </View>
                {renderStatusBadge(report?.sms.receiveSms || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    send and view SMS messages
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    SEND_SMS for automated payment reminder dispatches
                  </Text>
                </View>
                {renderStatusBadge(report?.sms.sendSms || 'undetermined')}
              </View>

              <TouchableOpacity
                onPress={() =>
                  permissionService.sendDirectSms('', 'Reminder from Khata regarding your account statement.')
                }
                style={[styles.actionBtnRow, { backgroundColor: colors.bgSecondary }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Authorize & Compose SMS Reminder
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Category 5: Camera & Microphone ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Camera size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Camera & Microphone
                </Text>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    take pictures and video
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    CAMERA for capturing bills, receipts and GST invoices
                  </Text>
                </View>
                {renderStatusBadge(report?.cameraMic.camera || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    record audio
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    RECORD_AUDIO for voice transaction memos & notes
                  </Text>
                </View>
                {renderStatusBadge(report?.cameraMic.microphone || 'undetermined')}
              </View>

              <View style={styles.btnRowDouble}>
                <TouchableOpacity
                  onPress={handleTestCamera}
                  style={[styles.halfBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                    Test Camera
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTestMicrophone}
                  style={[styles.halfBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                    Test Microphone
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Category 6: Contacts & Accounts ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Users size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Contacts & Accounts
                </Text>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    read your contacts
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    READ_CONTACTS for 1-tap customer and supplier additions
                  </Text>
                </View>
                {renderStatusBadge(report?.contactsAccounts.readContacts || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    Google & device accounts
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    GET_ACCOUNTS & Google Services unified auth linkage
                  </Text>
                </View>
                {renderStatusBadge(report?.contactsAccounts.getAccounts || 'undetermined')}
              </View>

              {contactCount !== null && (
                <View style={[styles.resultBox, { backgroundColor: colors.bgSecondary }]}>
                  <Text style={[styles.resultText, { color: colors.textPrimary }]}>
                    Found {contactCount} phone contacts ready for sync
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleTestContacts}
                style={[styles.actionBtnRow, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                  Query Real Phone Contacts
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Category 7: Location Access ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <MapPin size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Location Access
                </Text>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    access precise location only in foreground
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    ACCESS_FINE_LOCATION for high-accuracy transaction geotagging
                  </Text>
                </View>
                {renderStatusBadge(report?.location.preciseLocation || 'undetermined')}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionItem}>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                    access approximate location only in foreground
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    ACCESS_COARSE_LOCATION for local merchant market rates
                  </Text>
                </View>
                {renderStatusBadge(report?.location.foregroundLocation || 'undetermined')}
              </View>

              {locationResult && (
                <View style={[styles.resultBox, { backgroundColor: colors.bgSecondary }]}>
                  <Text style={[styles.resultText, { color: colors.textPrimary }]}>
                    GPS Fix: {locationResult.latitude.toFixed(5)}, {locationResult.longitude.toFixed(5)}
                    {locationResult.city ? ` (${locationResult.city})` : ''} - Accuracy: ±{Math.round(locationResult.accuracy || 0)}m
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleTestGps}
                disabled={testingGps}
                style={[styles.actionBtnRow, { backgroundColor: colors.primary }]}
              >
                {testingGps ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                    Acquire Real GPS Coordinates
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Category 8: Other App Capabilities & Hardware ── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Activity size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Other App Capabilities & Hardware
                </Text>
              </View>

              <View style={styles.capabilityRow}>
                <Fingerprint size={16} color={colors.primary} />
                <Text style={[styles.capabilityLabel, { color: colors.textPrimary }]}>
                  Use fingerprint / biometric hardware
                </Text>
                <Text style={[styles.capabilityValue, { color: colors.success }]}>
                  {report?.hardwareCapabilities.biometrics ? 'Available' : 'Emulated/Not Enrolled'}
                </Text>
              </View>

              <View style={styles.capabilityRow}>
                <Smartphone size={16} color={colors.primary} />
                <Text style={[styles.capabilityLabel, { color: colors.textPrimary }]}>
                  Control vibration motor
                </Text>
                <Text style={[styles.capabilityValue, { color: colors.success }]}>Active</Text>
              </View>

              <View style={styles.capabilityRow}>
                <Wifi size={16} color={colors.primary} />
                <Text style={[styles.capabilityLabel, { color: colors.textPrimary }]}>
                  View Wi-Fi & network connections
                </Text>
                <Text style={[styles.capabilityValue, { color: colors.success }]}>
                  {report?.hardwareCapabilities.networkConnected ? 'Connected' : 'Offline'}
                </Text>
              </View>

              <View style={styles.capabilityRow}>
                <Activity size={16} color={colors.primary} />
                <Text style={[styles.capabilityLabel, { color: colors.textPrimary }]}>
                  Run foreground service (dataSync)
                </Text>
                <Text style={[styles.capabilityValue, { color: colors.success }]}>Ready</Text>
              </View>

              <View style={styles.capabilityRow}>
                <Activity size={16} color={colors.primary} />
                <Text style={[styles.capabilityLabel, { color: colors.textPrimary }]}>
                  Prevent phone from sleeping (WAKE_LOCK)
                </Text>
                <Text style={[styles.capabilityValue, { color: colors.success }]}>Declared</Text>
              </View>

              <View style={styles.capabilityRow}>
                <Activity size={16} color={colors.primary} />
                <Text style={[styles.capabilityLabel, { color: colors.textPrimary }]}>
                  Advertising ID & Play Referrer API
                </Text>
                <Text style={[styles.capabilityValue, { color: colors.success }]}>Configured</Text>
              </View>

              {networkInfo && (
                <View style={[styles.resultBox, { backgroundColor: colors.bgSecondary }]}>
                  <Text style={[styles.resultText, { color: colors.textPrimary }]}>
                    {networkInfo}
                  </Text>
                </View>
              )}

              <View style={styles.btnRowDouble}>
                <TouchableOpacity
                  onPress={handleTestBiometrics}
                  style={[styles.halfBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                    Test Biometrics
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTestVibration}
                  style={[styles.halfBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                    Test Vibration
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleTestNetwork}
                style={[styles.actionBtnRow, { backgroundColor: colors.bgSecondary, marginTop: 8 }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Check Wi-Fi & Network Hardware
                </Text>
              </TouchableOpacity>
            </View>

            {/* System Settings Shortcut */}
            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              style={[
                styles.systemSettingsCard,
                { backgroundColor: colors.bgSecondary, borderColor: colors.border },
              ]}
            >
              <ExternalLink size={18} color={colors.textSecondary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.systemSettingsTitle, { color: colors.textPrimary }]}>
                  Open Android System Settings
                </Text>
                <Text style={[styles.systemSettingsSub, { color: colors.textSecondary }]}>
                  View and revoke individual OS permissions directly in Android App Info
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  appBarTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  appBarSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  masterBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  bannerDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    marginTop: 4,
  },
  grantAllBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  grantAllBtnText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 12,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemMeta: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  itemSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  actionBtnRow: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnRowDouble: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  halfBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  capabilityLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  capabilityValue: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  resultBox: {
    padding: 10,
    borderRadius: 14,
    marginTop: 10,
  },
  resultText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  systemSettingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  systemSettingsTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  systemSettingsSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});
