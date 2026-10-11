// src/features/profile/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import {
  ShieldCheck,
  Lock,
  Bell,
  Smartphone,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  UserCheck,
  Trash2,
} from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { ScalePressable } from '../../../components/common/ScalePressable';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { useAuth } from '../../../app/providers/AuthProvider';
import { api } from '../../../services/api';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, changePassword, logout } = useAuth();

  // Notification Preferences State
  const [notifyEscrow, setNotifyEscrow] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifyWallet, setNotifyWallet] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Policy Modal State
  const [activePolicy, setActivePolicy] = useState<{ title: string; content: string } | null>(null);

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsChangingPass(true);
      await changePassword({ oldPassword, newPassword });
      setIsChangingPass(false);
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', 'Đổi mật khẩu thành công! Mẹ hãy ghi nhớ mật khẩu mới nhé.');
    } catch (err: any) {
      setIsChangingPass(false);
      Alert.alert('Lỗi đổi mật khẩu', err || 'Có lỗi xảy ra khi cập nhật mật khẩu.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Mẹ có chắc chắn muốn đăng xuất khỏi Kindr?', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa vĩnh viễn tài khoản?',
      'Hành động này sẽ hủy kích hoạt tài khoản, ẩn tất cả bài đăng và gỡ bỏ dữ liệu cá nhân của mẹ khỏi Kindr. Bạn không thể hoàn tác.',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Xác nhận xóa',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Cảnh báo lần cuối',
              'Mẹ có chắc chắn 100% muốn xóa tài khoản này? Mọi quyền lợi và số dư còn lại (nếu có) sẽ không thể phục hồi.',
              [
                { text: 'Dừng lại', style: 'cancel' },
                {
                  text: 'Đồng ý xóa vĩnh viễn',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const res = await api.delete('/auth/me');
                      Alert.alert(
                        'Đã xóa tài khoản',
                        res.data?.message || 'Tài khoản của mẹ đã được xóa thành công. Tạm biệt mẹ và bé!',
                        [
                          {
                            text: 'Đóng',
                            onPress: async () => {
                              await logout();
                            },
                          },
                        ]
                      );
                    } catch (err: any) {
                      const errMsg = err?.response?.data?.error || err?.message || 'Không thể xóa tài khoản lúc này.';
                      Alert.alert('Không thể xóa tài khoản', errMsg);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const showCharterModal = () => {
    setActivePolicy({
      title: 'Quy Chế Mẹ Bỉm Văn Minh',
      content:
        '1. Đồ đạc trao đổi phải đảm bảo sạch sẽ, an toàn vệ sinh cho bé.\n\n' +
        '2. Mô tả trung thực tình trạng sản phẩm (độ mới, phụ kiện, khuyết điểm nếu có).\n\n' +
        '3. Tôn trọng cam kết thời gian giao nhận, không tự ý hủy đơn sau khi đã đóng cọc.\n\n' +
        '4. Giao tiếp lịch sự, hòa nhã, chung tay xây dựng cộng đồng mẹ bỉm nuôi con văn minh.\n\n' +
        '5. Mọi hành vi gian lận hoặc gửi đồ hỏng nặng sẽ bị trừ Điểm Văn Minh và khóa tài khoản vĩnh viễn.',
    });
  };

  const showEscrowModal = () => {
    setActivePolicy({
      title: 'Cơ Chế Ký Quỹ Kép 6 Giờ',
      content:
        '1. Khi có yêu cầu đổi đồ, người mua đóng băng 100% Xu giá trị món đồ, người bán đặt cọc 10% Phí bảo chứng (SafeFee).\n\n' +
        '2. Cả hai bên kiểm tra mã xác nhận 6 ký tự khi gặp nhau bàn giao trực tiếp hoặc qua shipper.\n\n' +
        '3. Sau bàn giao, hệ thống kích hoạt đồng hồ đếm ngược 6 giờ Safeful Time để người mua kiểm tra sản phẩm.\n\n' +
        '4. Nếu sản phẩm đúng cam kết, Xu chuyển thẳng vào ví người bán. Nếu có tranh chấp, BQT Admin Kindr sẽ làm trọng tài phân xử công minh.',
    });
  };

  const showPrivacyModal = () => {
    setActivePolicy({
      title: 'Chính Sách Bảo Mật Dữ Liệu',
      content:
        '1. Kindr cam kết bảo vệ dữ liệu cá nhân của mọi gia đình thành viên.\n\n' +
        '2. Số điện thoại chỉ hiển thị cho đối tác sau khi bàn giao để hai bên tiện gọi điện, hoàn toàn không công khai trên mạng.\n\n' +
        '3. Hình ảnh và tài liệu người dùng tải lên được mã hóa và lưu trữ an toàn trên máy chủ Cloudinary Media CDN tiêu chuẩn quốc tế.\n\n' +
        '4. Kindr không bao giờ bán hoặc chia sẻ thông tin cá nhân cho bên thứ ba vì mục đích quảng cáo.',
    });
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Cài đặt & Bảo mật" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: HỆ THỐNG QUẢN TRỊ ADMIN (Chỉ dành riêng cho Admin) */}
        {currentUser?.role === 'admin' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hệ Thống Quản Trị (Admin Portal)</Text>
            </View>

            <View style={[styles.adminCard, styles.adminCardActive]}>
              <View style={styles.adminCardHeader}>
                <View style={[styles.adminIconBox, { backgroundColor: COLORS.tertiaryContainer }]}>
                  <ShieldAlert size={22} color={COLORS.warning} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.adminStatusTitle}>Tài Khoản Quản Trị Viên</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>ADMIN</Text>
                    </View>
                  </View>
                  <Text style={styles.adminStatusSub}>
                    Bạn có toàn quyền giám sát hệ thống, duyệt bài đăng, phân xử tranh chấp và duyệt lệnh rút tiền.
                  </Text>
                </View>
              </View>

              <View style={styles.adminActionRow}>
                <ScalePressable
                  style={styles.adminDashboardBtn}
                  scaleTo={0.96}
                  onPress={() => navigation.navigate('AdminDashboard')}
                >
                  <ShieldCheck size={16} color={COLORS.surface} style={{ marginRight: 6 }} />
                  <Text style={styles.adminDashboardBtnText}>Mở Bảng Quản Trị Admin</Text>
                </ScalePressable>
              </View>
            </View>
          </>
        )}

        {/* SECTION 2: BẢO MẬT TÀI KHOẢN */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bảo Mật Tài Khoản</Text>
        </View>

        <View style={styles.menuCard}>
          <ScalePressable style={styles.menuRow} scaleTo={0.98} onPress={() => setShowPasswordModal(true)}>
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.secondaryLight }]}>
              <Lock size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Đổi mật khẩu tài khoản</Text>
              <Text style={styles.menuSubLabel}>Cập nhật mật khẩu định kỳ để bảo vệ ví Xu an toàn</Text>
            </View>
            <ChevronRight size={18} color={COLORS.outline} />
          </ScalePressable>

          {currentUser?.email && (
            <View style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: COLORS.surfaceContainer }]}>
              <View style={[styles.menuIconBox, { backgroundColor: COLORS.primaryLight }]}>
                <CheckCircle2 size={18} color={COLORS.success} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Liên kết Google an toàn</Text>
                <Text style={styles.menuSubLabel}>{currentUser.email}</Text>
              </View>
              <View style={styles.linkedBadge}>
                <Text style={styles.linkedBadgeText}>Đã kết nối</Text>
              </View>
            </View>
          )}
        </View>

        {/* SECTION 3: CÀI ĐẶT THÔNG BÁO */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tùy Chọn Thông Báo</Text>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.tertiaryContainer }]}>
              <Bell size={18} color={COLORS.warning} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Biến động ví Xu & Giao dịch</Text>
              <Text style={styles.menuSubLabel}>Nhận tin khi cộng Xu chào mừng, nạp/rút hoặc đóng băng</Text>
            </View>
            <Switch
              value={notifyWallet}
              onValueChange={setNotifyWallet}
              trackColor={{ false: COLORS.outline, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>

          <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: COLORS.surfaceContainer }]}>
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.secondaryLight }]}>
              <ShieldCheck size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Bảo chứng 6 giờ Safeful Time</Text>
              <Text style={styles.menuSubLabel}>Thông báo đếm ngược thời gian kiểm định hàng</Text>
            </View>
            <Switch
              value={notifyEscrow}
              onValueChange={setNotifyEscrow}
              trackColor={{ false: COLORS.outline, true: COLORS.secondary }}
              thumbColor={COLORS.surface}
            />
          </View>

          <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: COLORS.surfaceContainer }]}>
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.adminBadge }]}>
              <Smartphone size={18} color={COLORS.adminBadgeText} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Rung phản hồi xúc giác</Text>
              <Text style={styles.menuSubLabel}>Cảm giác chân thực khi bấm nút thao tác trong ứng dụng</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: COLORS.outline, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        {/* SECTION 4: QUY CHẾ & PHÁP LÝ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quy Chế & Pháp Lý</Text>
        </View>

        <View style={styles.menuCard}>
          <ScalePressable style={styles.menuRow} scaleTo={0.98} onPress={showCharterModal}>
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.errorContainer }]}>
              <Sparkles size={18} color={COLORS.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Quy chế mẹ bỉm văn minh</Text>
              <Text style={styles.menuSubLabel}>Tiêu chuẩn ứng xử và chia sẻ đồ chơi của cộng đồng</Text>
            </View>
            <ChevronRight size={18} color={COLORS.outline} />
          </ScalePressable>

          <ScalePressable
            style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: COLORS.surfaceContainer }]}
            scaleTo={0.98}
            onPress={showEscrowModal}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.secondaryLight }]}>
              <FileText size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Quy trình bảo chứng ký quỹ kép</Text>
              <Text style={styles.menuSubLabel}>Cơ chế bảo vệ 100% an toàn giao dịch</Text>
            </View>
            <ChevronRight size={18} color={COLORS.outline} />
          </ScalePressable>

          <ScalePressable
            style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: COLORS.surfaceContainer }]}
            scaleTo={0.98}
            onPress={showPrivacyModal}
          >
            <View style={[styles.menuIconBox, { backgroundColor: COLORS.surfaceContainer }]}>
              <HelpCircle size={18} color={COLORS.text} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Chính sách bảo mật & Dữ liệu</Text>
              <Text style={styles.menuSubLabel}>Cam kết bảo mật thông tin gia đình mẹ</Text>
            </View>
            <ChevronRight size={18} color={COLORS.outline} />
          </ScalePressable>
        </View>

        {/* SECTION 5: THÔNG TIN ỨNG DỤNG */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoTitle}>Kindr - Nền Tảng Trao Đổi Đồ Chơi Bé Yêu</Text>
          <Text style={styles.appInfoVersion}>Phiên bản 1.0.0 (Bản chuẩn phát hành 2026)</Text>
          <Text style={styles.appInfoCopy}>Bản quyền thuộc về Kindr Kids Community © 2026</Text>
        </View>

        {/* Logout Button */}
        <ScalePressable style={styles.logoutBtn} scaleTo={0.96} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </ScalePressable>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Trash2 size={15} color={COLORS.outline} />
          <Text style={styles.deleteAccountText}>Xóa tài khoản vĩnh viễn</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi Mật Khẩu</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Vui lòng nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 6 ký tự).
              </Text>

              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>Mật khẩu hiện tại</Text>
                <Input
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Nhập mật khẩu hiện tại"
                  secureTextEntry={!showOldPass}
                  icon={<Lock size={18} color={COLORS.textMuted} />}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>Mật khẩu mới</Text>
                <Input
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Tối thiểu 6 ký tự"
                  secureTextEntry={!showNewPass}
                  icon={<Lock size={18} color={COLORS.textMuted} />}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>Xác nhận mật khẩu mới</Text>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  secureTextEntry={!showNewPass}
                  icon={<Lock size={18} color={COLORS.textMuted} />}
                />
              </View>

              <View style={{ marginTop: 16 }}>
                <Button
                  title={isChangingPass ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
                  onPress={handleChangePasswordSubmit}
                  disabled={isChangingPass}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Policy / Charter View Modal */}
      <Modal visible={!!activePolicy} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.policyCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activePolicy?.title}</Text>
              <TouchableOpacity onPress={() => setActivePolicy(null)}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.policyText}>{activePolicy?.content}</Text>
            </ScrollView>
            <View style={{ marginTop: 16 }}>
              <Button title="Đã hiểu & Đồng ý" onPress={() => setActivePolicy(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.sm,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: SPACING.md,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  adminCardActive: {
    backgroundColor: COLORS.tertiaryContainer,
    borderColor: COLORS.warning,
  },
  adminCardInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.outline,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  roleBadge: {
    backgroundColor: COLORS.adminBadgeText,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  adminStatusSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  adminActionRow: {
    marginTop: 14,
    gap: 10,
  },
  adminDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.default,
    paddingVertical: 12,
    ...SHADOWS.soft,
  },
  adminDashboardBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.default,
    paddingVertical: 12,
  },
  switchRoleBtnAdmin: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.btn,
  },
  switchRoleBtnUser: {
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  switchRoleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.card,
    marginBottom: SPACING.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSubLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  linkedBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  linkedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  appInfoSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  appInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  appInfoVersion: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  appInfoCopy: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorContainer,
    borderWidth: 1,
    borderColor: COLORS.errorContainer,
    borderRadius: RADIUS.default,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginBottom: 32,
  },
  deleteAccountText: {
    fontSize: 13,
    color: COLORS.outline,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    ...SHADOWS.ambient,
  },
  policyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    ...SHADOWS.ambient,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  modalField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  policyText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 22,
  },
});

export default SettingsScreen;
