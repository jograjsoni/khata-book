/**
 * Unified Real Native Permissions & Hardware Access Service
 * Provides genuine, runtime permission checks and user authorization prompts
 * across Contacts, Location, Camera, Audio/Microphone, Notifications, Phone, SMS,
 * Bluetooth/Nearby Devices, and Biometrics/Hardware.
 */
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Initialize Foreground Notification Behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Graceful fallback for non-supported environments
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface PermissionItemStatus {
  id: string;
  name: string;
  category: 'nearby' | 'notifications' | 'phone' | 'sms' | 'camera_mic' | 'contacts_accounts' | 'location' | 'capabilities';
  status: PermissionState;
  description: string;
  androidPermission?: string;
}

export interface AllPermissionsReport {
  nearbyDevices: {
    localNetwork: PermissionState;
    bluetoothConnect: PermissionState;
    bluetoothScan: PermissionState;
  };
  notifications: {
    postNotifications: PermissionState;
  };
  phone: {
    readPhoneNumbers: PermissionState;
    readPhoneState: PermissionState;
    callPhone: PermissionState;
  };
  sms: {
    readSms: PermissionState;
    receiveSms: PermissionState;
    sendSms: PermissionState;
  };
  cameraMic: {
    camera: PermissionState;
    microphone: PermissionState;
  };
  contactsAccounts: {
    readContacts: PermissionState;
    getAccounts: PermissionState;
  };
  location: {
    foregroundLocation: PermissionState;
    preciseLocation: PermissionState;
  };
  hardwareCapabilities: {
    biometrics: boolean;
    fingerprintHardware: boolean;
    biometricsEnrolled: boolean;
    vibrationSupported: boolean;
    networkConnected: boolean;
    wifiConnected: boolean;
  };
}

class PermissionService {
  // ── Helper: Safe Android PermissionsAndroid Request ────────────────────────
  private async checkAndroidPermission(permission: string): Promise<PermissionState> {
    if (Platform.OS !== 'android') return 'granted';
    try {
      const has = await PermissionsAndroid.check(permission as any);
      return has ? 'granted' : 'denied';
    } catch {
      return 'undetermined';
    }
  }

  private async requestAndroidPermission(
    permission: string,
    rationale?: { title: string; message: string; buttonPositive?: string }
  ): Promise<PermissionState> {
    if (Platform.OS !== 'android') return 'granted';
    try {
      const result = await PermissionsAndroid.request(
        permission as any,
        rationale
          ? {
              title: rationale.title,
              message: rationale.message,
              buttonPositive: rationale.buttonPositive || 'Allow',
            }
          : undefined
      );
      if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'denied';
      return 'denied';
    } catch {
      return 'denied';
    }
  }

  // ── 1. Contacts & Accounts ──────────────────────────────────────────────────
  async checkContactsPermission(): Promise<PermissionState> {
    try {
      const res = await Contacts.getPermissionsAsync();
      if (res.status === 'granted') return 'granted';
      if (res.status === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
    }
  }

  async requestContactsPermission(): Promise<boolean> {
    try {
      const res = await Contacts.requestPermissionsAsync();
      if (res.status === 'granted') return true;
    } catch {}

    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'Khata needs access to your contacts to import customers and suppliers instantly.',
        }
      );
      return status === 'granted';
    }
    return false;
  }

  async requestAccountsPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.GET_ACCOUNTS,
        {
          title: 'Google & Device Accounts Permission',
          message: 'Khata uses account credentials to securely link Google Sign-In with email records.',
        }
      );
      return status === 'granted';
    }
    return true;
  }

  async getDeviceContactsCount(): Promise<number> {
    try {
      const has = await this.checkContactsPermission();
      if (has !== 'granted') return 0;
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      return data ? data.length : 0;
    } catch {
      return 0;
    }
  }

  // ── 2. Location (Foreground & Precise) ──────────────────────────────────────
  async checkLocationPermission(): Promise<PermissionState> {
    try {
      const res = await Location.getForegroundPermissionsAsync();
      if (res.status === 'granted') return 'granted';
      if (res.status === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      if (res.status === 'granted') return true;
    } catch {}

    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Khata uses foreground location to geotag ledger receipts and nearest merchant stores.',
        }
      );
      return status === 'granted';
    }
    return false;
  }

  async getRealCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    city?: string;
    region?: string;
  } | null> {
    try {
      const granted = await this.requestLocationPermission();
      if (!granted) return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let city = '';
      let region = '';
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverse && reverse.length > 0) {
          city = reverse[0].city || reverse[0].subregion || '';
          region = reverse[0].region || reverse[0].country || '';
        }
      } catch {}

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        city,
        region,
      };
    } catch {
      return null;
    }
  }

  // ── 3. Camera & Microphone ──────────────────────────────────────────────────
  async checkCameraPermission(): Promise<PermissionState> {
    try {
      const res = await Camera.getCameraPermissionsAsync();
      if (res.status === 'granted') return 'granted';
      if (res.status === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const res = await Camera.requestCameraPermissionsAsync();
      if (res.status === 'granted') return true;
    } catch {}

    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Khata requires camera access to capture bill receipts and document proofs.',
        }
      );
      return status === 'granted';
    }
    return false;
  }

  async checkMicrophonePermission(): Promise<PermissionState> {
    try {
      const res = await Camera.getMicrophonePermissionsAsync();
      if (res.status === 'granted') return 'granted';
      if (res.status === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const res = await Camera.requestMicrophonePermissionsAsync();
      if (res.status === 'granted') return true;
    } catch {}

    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Khata requires microphone access to record audio transaction memos and voice notes.',
        }
      );
      return status === 'granted';
    }
    return false;
  }

  // ── 4. Notifications ────────────────────────────────────────────────────────
  async checkNotificationPermission(): Promise<PermissionState> {
    try {
      const res = await Notifications.getPermissionsAsync();
      if (res.status === 'granted') return 'granted';
      if (res.status === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      const res = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      if (res.status === 'granted') return true;
    } catch {}

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notifications Permission',
          message: 'Receive instant payment receipts, credit reminders, and Sileo ledger alerts.',
        }
      );
      return status === 'granted';
    }
    return true;
  }

  async sendRealTestNotification(title: string, body: string): Promise<boolean> {
    try {
      const granted = await this.requestNotificationPermission();
      if (!granted) return false;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // deliver immediately
      });
      return true;
    } catch (err) {
      console.warn('[permissionService] Notification trigger error:', err);
      return false;
    }
  }

  // ── 5. Phone & Telephony ────────────────────────────────────────────────────
  async checkPhoneStatePermission(): Promise<PermissionState> {
    return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
  }

  async requestPhoneStatePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: 'Phone State & Telephony Permission',
          message: 'Khata detects carrier connectivity and ensures reliable ledger sync.',
        }
      );
      return status === 'granted';
    }
    return true;
  }

  async checkReadPhoneNumbersPermission(): Promise<PermissionState> {
    return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS);
  }

  async requestReadPhoneNumbersPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
        {
          title: 'Phone Numbers Permission',
          message: 'Khata automatically verifies your registered merchant SIM number.',
        }
      );
      return status === 'granted';
    }
    return true;
  }

  async checkCallPhonePermission(): Promise<PermissionState> {
    return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
  }

  async requestCallPhonePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const status = await this.requestAndroidPermission(
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        {
          title: 'Direct Phone Call Permission',
          message: 'Khata allows one-tap direct calling to your customers and suppliers.',
        }
      );
      return status === 'granted';
    }
    return true;
  }

  async directCall(phoneNumber: string): Promise<void> {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (!cleanNumber) {
      Alert.alert('Invalid Number', 'Please provide a valid phone number.');
      return;
    }
    await this.requestCallPhonePermission();
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call on this device.');
    });
  }

  // ── 6. SMS Messages ─────────────────────────────────────────────────────────
  async checkReadSmsPermission(): Promise<PermissionState> {
    return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.READ_SMS);
  }

  async checkReceiveSmsPermission(): Promise<PermissionState> {
    return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
  }

  async checkSendSmsPermission(): Promise<PermissionState> {
    return this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.SEND_SMS);
  }

  async requestSmsPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const statuses = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
        ]);
        return (
          statuses[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED ||
          statuses[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch {
        return false;
      }
    }
    return true;
  }

  async sendDirectSms(phoneNumber: string, message: string): Promise<void> {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const encodedBody = encodeURIComponent(message);
    const url = Platform.OS === 'ios'
      ? `sms:${cleanNumber}&body=${encodedBody}`
      : `sms:${cleanNumber}?body=${encodedBody}`;

    await this.requestSmsPermissions();
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open SMS application.');
    });
  }

  // ── 7. Nearby Devices & Bluetooth ───────────────────────────────────────────
  async checkBluetoothPermissions(): Promise<{
    connect: PermissionState;
    scan: PermissionState;
    nearbyWifi: PermissionState;
  }> {
    if (Platform.OS !== 'android') {
      return { connect: 'granted', scan: 'granted', nearbyWifi: 'granted' };
    }
    const connect = await this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
    const scan = await this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
    const nearbyWifi = await this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
    return { connect, scan, nearbyWifi };
  }

  async requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissionsToRequest: any[] = [];
        if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
          permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }
        if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) {
          permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        }
        if (PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES) {
          permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
        }

        if (permissionsToRequest.length > 0) {
          const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
          return Object.values(results).some((val) => val === PermissionsAndroid.RESULTS.GRANTED);
        }
      } catch {
        return false;
      }
    }
    return true;
  }

  // ── 8. Biometric Hardware & Haptics ─────────────────────────────────────────
  async checkBiometrics(): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    types: LocalAuthentication.AuthenticationType[];
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return { hasHardware, isEnrolled, types };
    } catch {
      return { hasHardware: false, isEnrolled: false, types: [] };
    }
  }

  async authenticateWithBiometrics(
    promptMessage = 'Unlock Khata with Fingerprint or Face ID'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const bio = await this.checkBiometrics();
      if (!bio.hasHardware || !bio.isEnrolled) {
        return { success: false, error: 'Biometric hardware not enrolled on this device.' };
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use PIN',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: (res as any).error || 'Biometric authentication failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Biometric authentication failed' };
    }
  }

  async triggerVibration(_type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
    // Haptics completely disabled per user preference
    return;
  }

  async getNetworkDetails(): Promise<NetInfoState> {
    return NetInfo.fetch();
  }

  // ── 9. Comprehensive System Audit ───────────────────────────────────────────
  async getAllPermissionsStatus(): Promise<AllPermissionsReport> {
    const [
      contacts,
      accounts,
      fineLoc,
      cam,
      mic,
      notif,
      phoneState,
      phoneNum,
      callPhone,
      readSms,
      recvSms,
      sendSms,
      btConnect,
      btScan,
      nearbyWifi,
      bio,
      net,
    ] = await Promise.all([
      this.checkContactsPermission(),
      this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.GET_ACCOUNTS),
      this.checkLocationPermission(),
      this.checkCameraPermission(),
      this.checkMicrophonePermission(),
      this.checkNotificationPermission(),
      this.checkPhoneStatePermission(),
      this.checkReadPhoneNumbersPermission(),
      this.checkCallPhonePermission(),
      this.checkReadSmsPermission(),
      this.checkReceiveSmsPermission(),
      this.checkSendSmsPermission(),
      this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
      this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
      this.checkAndroidPermission(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES),
      this.checkBiometrics(),
      this.getNetworkDetails(),
    ]);

    return {
      nearbyDevices: {
        localNetwork: nearbyWifi,
        bluetoothConnect: btConnect,
        bluetoothScan: btScan,
      },
      notifications: {
        postNotifications: notif,
      },
      phone: {
        readPhoneNumbers: phoneNum,
        readPhoneState: phoneState,
        callPhone: callPhone,
      },
      sms: {
        readSms: readSms,
        receiveSms: recvSms,
        sendSms: sendSms,
      },
      cameraMic: {
        camera: cam,
        microphone: mic,
      },
      contactsAccounts: {
        readContacts: contacts,
        getAccounts: accounts,
      },
      location: {
        foregroundLocation: fineLoc,
        preciseLocation: fineLoc,
      },
      hardwareCapabilities: {
        biometrics: bio.hasHardware,
        fingerprintHardware: bio.hasHardware,
        biometricsEnrolled: bio.isEnrolled,
        vibrationSupported: true,
        networkConnected: !!net.isConnected,
        wifiConnected: net.type === 'wifi',
      },
    };
  }

  // ── 10. Sequential Real Grant All ───────────────────────────────────────────
  async requestAllPermissions(): Promise<void> {
    await this.requestNotificationPermission();
    await this.requestContactsPermission();
    await this.requestCameraPermission();
    await this.requestMicrophonePermission();
    await this.requestLocationPermission();
    await this.requestPhoneStatePermission();
    await this.requestCallPhonePermission();
    await this.requestSmsPermissions();
    await this.requestBluetoothPermissions();
    await this.requestAccountsPermission();
  }
}

export const permissionService = new PermissionService();
export default permissionService;
