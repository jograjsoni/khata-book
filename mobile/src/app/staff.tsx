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
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  X,
  UserCheck,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore, StaffMember } from '../store/useKhataStore';
import { Header } from '../components/common/Header';

export default function StaffScreen() {
  const router = useRouter();
  const {
    staff,
    updateStaffAttendance,
    toggleStaffSalaryStatus,
    addStaff,
    isDarkMode,
  } = useKhataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Store Manager');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');

  const roles = [
    'Store Manager',
    'Billing Executive',
    'Delivery Associate',
    'Inventory Assistant',
    'Sales Executive',
  ];

  const filteredStaff = useMemo(() => {
    let list = staff;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q)
      );
    }
    return list;
  }, [staff, searchQuery]);

  const handleAddStaff = () => {
    if (!name.trim()) {
      Alert.alert('Staff Name Required', 'Please enter employee name.');
      return;
    }
    const numSal = parseFloat(salary.replace(/[^0-9.]/g, ''));
    if (!numSal || isNaN(numSal) || numSal <= 0) {
      Alert.alert('Salary Required', 'Please enter monthly salary.');
      return;
    }

    addStaff({
      name: name.trim(),
      role,
      salary: numSal,
      salaryPeriod: 'mo',
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      attendance: 'Present',
      salaryStatus: 'Unpaid',
      phone: phone.trim() ? `+91 ${phone.replace(/[^0-9]/g, '').slice(-10)}` : undefined,
    });

    setModalVisible(false);
    setName('');
    setSalary('');
    setPhone('');
    Alert.alert('Staff Added', `${name.trim()} added to your payroll.`);
  };

  const handleCycleAttendance = (member: StaffMember) => {
    const nextAttendance: Record<StaffMember['attendance'], StaffMember['attendance']> = {
      Present: 'Absent',
      Absent: 'On Leave',
      'On Leave': 'Present',
    };
    updateStaffAttendance(member.id, nextAttendance[member.attendance]);
  };

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="Staff"
        subtitle="Payroll, Attendance & Shift Tracking"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[styles.headerAddBtn, { backgroundColor: THEME.colors.primary }]}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.headerAddText}>Add Staff</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: bgCard, borderColor: border }]}>
          <Search size={16} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search staff member by name or role"
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Toolbar matching staff.html */}
        <View style={styles.toolbarRow}>
          <Text style={[styles.staffCount, { color: textMuted }]}>
            {filteredStaff.length} staff members registered
          </Text>
          <Text style={[styles.sortText, { color: textMuted }]}>Name (A-Z)</Text>
        </View>

        {/* Staff Payroll List */}
        <View style={styles.staffList}>
          {filteredStaff.length === 0 ? (
            <View style={[styles.staffCard, { backgroundColor: bgCard, borderColor: border, padding: 32, alignItems: 'center', justifyContent: 'center' }]}>
              <Users size={32} color={THEME.colors.primary} style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: textPrimary, marginBottom: 4 }}>
                No Staff Members Added
              </Text>
              <Text style={{ fontSize: 12, color: textMuted, textAlign: 'center', marginBottom: 14 }}>
                Manage staff payroll, daily attendance, and salary slips in one place.
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: THEME.colors.primary }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Add First Staff</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredStaff.map((member) => {
            const isPresent = member.attendance === 'Present';
            const isAbsent = member.attendance === 'Absent';
            const isPaid = member.salaryStatus === 'Paid';

            return (
              <View
                key={member.id}
                style={[styles.staffCard, { backgroundColor: bgCard, borderColor: border }]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.staffInfoLeft}>
                    <View
                      style={[
                        styles.avatarCircle,
                        {
                          backgroundColor: isPresent
                            ? THEME.colors.primaryBg
                            : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: isPresent ? THEME.colors.primary : textMuted },
                        ]}
                      >
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View>
                      <Text style={[styles.staffName, { color: textPrimary }]}>{member.name}</Text>
                      <Text style={[styles.staffRole, { color: textMuted }]}>{member.role}</Text>
                    </View>
                  </View>

                  {/* Attendance & Salary Badges */}
                  <View style={styles.badgesCol}>
                    <TouchableOpacity
                      onPress={() => handleCycleAttendance(member)}
                      style={[
                        styles.attendancePill,
                        {
                          backgroundColor: isPresent
                            ? THEME.colors.successBg
                            : isAbsent
                            ? '#FEE2E2'
                            : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.attendanceText,
                          {
                            color: isPresent
                              ? THEME.colors.success
                              : isAbsent
                              ? THEME.colors.danger
                              : '#D97706',
                          },
                        ]}
                      >
                        {member.attendance}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => toggleStaffSalaryStatus(member.id)}
                      style={[
                        styles.salaryPill,
                        {
                          backgroundColor: isPaid ? THEME.colors.primaryBg : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.salaryPillText,
                          { color: isPaid ? THEME.colors.primary : textMuted },
                        ]}
                      >
                        {member.salaryStatus}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Salary details & joined date */}
                <View style={[styles.cardFooterRow, { borderTopColor: border }]}>
                  <Text style={[styles.metaText, { color: textMuted }]}>
                    Joined {member.joinedDate} {member.phone ? `· ${member.phone}` : ''}
                  </Text>
                  <Text style={[styles.salaryText, { color: textPrimary }]}>
                    ₹ {member.salary.toLocaleString('en-IN')}/{member.salaryPeriod}
                  </Text>
                </View>
              </View>
            );
          })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Staff Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: border }]}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Add Staff Member</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
              >
                <X size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: textMuted }]}>Staff Full Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="Enter staff full name"
                placeholderTextColor={textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Designation / Role</Text>
              <View style={styles.rolesGrid}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: role === r ? THEME.colors.primary : isDarkMode ? '#334155' : '#F1F5F9',
                        borderColor: role === r ? THEME.colors.primary : border,
                      },
                    ]}
                  >
                    <Text style={[styles.roleText, { color: role === r ? '#FFFFFF' : textPrimary }]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: textMuted, marginTop: 12 }]}>
                Monthly Salary (₹) *
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="25000"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                value={salary}
                onChangeText={setSalary}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Mobile Phone</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <TouchableOpacity
                onPress={handleAddStaff}
                style={[styles.submitStaffBtn, { backgroundColor: THEME.colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={styles.submitStaffText}>SAVE TO STAFF DIRECTORY</Text>
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
  headerAddText: {
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
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  staffCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '500',
  },
  staffList: {
    gap: 10,
  },
  staffCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  staffInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
  },
  staffRole: {
    fontSize: 12,
    marginTop: 2,
  },
  badgesCol: {
    flexDirection: 'row',
    gap: 6,
  },
  attendancePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  attendanceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  salaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  salaryPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaText: {
    fontSize: 11,
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '800',
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
  closeBtn: {
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
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submitStaffBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitStaffText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
