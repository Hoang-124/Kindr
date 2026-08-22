// src/features/auth/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  useWindowDimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { useAuth } from '../../../app/providers/AuthProvider';
import { APP_CONFIG } from '../../../config/appConfig';
import Input from '../../../components/common/Input';
import FormSelect from '../../../components/form/FormSelect';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import GoogleSignInButton from '../../../components/common/GoogleSignInButton';
import AddressMapPreview from '../../../components/common/AddressMapPreview';
import { User, Phone, Mail, Lock, MapPin, ArrowLeft } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { registerWithCredentials, loginWithGoogle } = useAuth();
  const { width, height } = useWindowDimensions();

  const isTabletOrDesktop = width >= 600;
  const isCompactHeight = height < 700;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  
  const [error, setError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const [loading, setLoading] = useState(false);

  const districtOptions = APP_CONFIG.districts.map(d => ({
    value: d.id,
    label: d.name,
  }));

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (/@(gmail|googlemail)\.com$/i.test(text.trim())) {
      setEmailWarning('Mẹ đang dùng Gmail? Vui lòng chọn "Đăng ký nhanh với Google" bên dưới.');
    } else {
      setEmailWarning('');
    }
  };

  const handleRegister = async () => {
    // 1. Validate Full Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Vui lòng nhập họ và tên (ít nhất 2 ký tự).');
      return;
    }

    // 2. Validate Phone
    const cleanPhone = phone.trim();
    if (!cleanPhone || !/^0\d{9}$/.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng 0).');
      return;
    }

    // 3. Validate Email (if provided)
    const cleanEmail = email.trim();
    if (cleanEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError('Địa chỉ email không đúng định dạng.');
        return;
      }
      if (/@(gmail|googlemail)\.com$/i.test(cleanEmail)) {
        setError('Địa chỉ Gmail vui lòng sử dụng nút "Đăng ký nhanh với Google" ở bên dưới.');
        return;
      }
    }

    // 4. Validate Password
    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    // 5. Validate Confirm Password
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    // 6. Validate District
    if (!districtId) {
      setError('Vui lòng chọn Quận/Huyện.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const districtName = districtOptions.find(d => d.value === districtId)?.label || '';
      await registerWithCredentials({
        name: fullName.trim(),
        phone: cleanPhone,
        password: password.trim(),
        email: cleanEmail || undefined,
        districtId,
        districtName,
        addressDetail: addressDetail.trim(),
      });
      setLoading(false);
    } catch (apiErr: any) {
      setError(apiErr || 'Đăng ký không thành công. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const selectedDistrictName = districtOptions.find(d => d.value === districtId)?.label || '';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isTabletOrDesktop && styles.contentContainerTablet,
      ]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={[styles.cardFrame, isTabletOrDesktop && styles.cardFrameTablet]}>
        {/* Header with back button */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Đăng ký thành viên</Text>
            <Text style={styles.subtitle}>Cộng đồng mẹ bỉm chia sẻ đồ dùng hữu ích cho con.</Text>
          </View>
        </View>

        <FormError message={error} />

        {/* Row 1: Họ tên + Số điện thoại */}
        <View style={styles.gridRow}>
          <View style={styles.col}>
            <Input
              compact
              label="Họ và tên mẹ"
              placeholder="VD: Nguyễn Lan"
              value={fullName}
              onChangeText={setFullName}
              icon={<User size={15} color={COLORS.outline} />}
            />
          </View>
          <View style={styles.col}>
            <Input
              compact
              label="Số điện thoại"
              placeholder="0905123456"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon={<Phone size={15} color={COLORS.outline} />}
            />
          </View>
        </View>

        {/* Row 2: Mật khẩu + Xác nhận mật khẩu */}
        <View style={styles.gridRow}>
          <View style={styles.col}>
            <Input
              compact
              label="Mật khẩu"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              icon={<Lock size={15} color={COLORS.outline} />}
            />
          </View>
          <View style={styles.col}>
            <Input
              compact
              label="Xác nhận MK"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              icon={<Lock size={15} color={COLORS.outline} />}
            />
          </View>
        </View>

        {/* Row 3: Khu vực Đà Nẵng + Địa chỉ chi tiết */}
        <View style={styles.gridRow}>
          <View style={styles.col}>
            <FormSelect
              compact
              label="Quận/Huyện"
              placeholder="Chọn Quận"
              options={districtOptions}
              selectedValue={districtId}
              onValueChange={setDistrictId}
              error={error && !districtId ? 'Chọn quận' : undefined}
            />
          </View>
          <View style={styles.col}>
            <Input
              compact
              label="Địa chỉ chi tiết"
              placeholder="Số nhà, tên đường..."
              value={addressDetail}
              onChangeText={setAddressDetail}
              icon={<MapPin size={15} color={COLORS.outline} />}
            />
          </View>
        </View>

        {/* Interactive Address Map Preview */}
        <AddressMapPreview
          districtId={districtId}
          districtName={selectedDistrictName}
          addressDetail={addressDetail}
          onLocationSelect={setSelectedCoords}
          compact
        />

        {/* Row 4: Email (Outlook, Yahoo, iCloud...) */}
        <View style={styles.emailWrapper}>
          <Input
            compact
            label="Email (Outlook, Yahoo, iCloud...)"
            placeholder="me.lan@outlook.com (Tùy chọn)"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={15} color={COLORS.outline} />}
          />
          {emailWarning ? (
            <Text style={styles.warningText}>ℹ️ {emailWarning}</Text>
          ) : (
            <Text style={styles.helperText}>* Dùng Gmail? Vui lòng chọn "Đăng ký nhanh với Google" bên dưới.</Text>
          )}
        </View>

        {/* Action Buttons: Stacked Cleanly */}
        <View style={styles.actionsRow}>
          <Button
            title="Tạo tài khoản"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerBtn}
          />
          
          <GoogleSignInButton
            compact
            title="Đăng ký nhanh với Google"
            onSuccess={async (data) => {
              setLoading(true);
              setError('');
              try {
                await loginWithGoogle(data);
                setLoading(false);
              } catch (err: any) {
                setError(err || 'Đăng ký Google không thành công.');
                setLoading(false);
              }
            }}
            onError={(msg) => setError(msg)}
            wrapperStyle={styles.googleBtnWrap}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: Platform.OS === 'ios' ? 24 : 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainerTablet: {
    paddingVertical: SPACING.lg,
  },
  cardFrame: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(58, 103, 88, 0.1)',
    ...SHADOWS.card,
  },
  cardFrameTablet: {
    padding: SPACING.lg,
    maxWidth: 500,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
    gap: SPACING.xs + 2,
  },
  backBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 22,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    fontSize: 11.5,
    color: COLORS.onSurfaceVariant,
    lineHeight: 15,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  emailWrapper: {
    marginBottom: 2,
  },
  helperText: {
    fontSize: 10.5,
    color: COLORS.outline,
    fontStyle: 'italic',
    marginTop: -4,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  warningText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 2,
    paddingHorizontal: 2,
    lineHeight: 14,
  },
  actionsRow: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 4,
  },
  registerBtn: {
    height: 40,
    borderRadius: RADIUS.full,
  },
  googleBtnWrap: {
    width: '100%',
    marginVertical: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12.5,
    color: COLORS.onSurfaceVariant,
  },
  loginLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default RegisterScreen;
