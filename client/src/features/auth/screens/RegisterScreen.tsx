// src/features/auth/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../../theme';
import { useAuth } from '../../../app/providers/AuthProvider';
import { APP_CONFIG } from '../../../config/appConfig';
import Input from '../../../components/common/Input';
import FormSelect from '../../../components/form/FormSelect';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import { User, Phone, Mail, Lock, MapPin, ArrowLeft } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { register, registerWithCredentials } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const districtOptions = APP_CONFIG.districts.map(d => ({
    value: d.id,
    label: d.name,
  }));

  const handleRegister = async () => {
    if (!fullName || !phone || !password) {
      setError('Vui lòng điền họ tên, số điện thoại và mật khẩu.');
      return;
    }

    if (phone.length < 10) {
      setError('Số điện thoại không hợp lệ (tối thiểu 10 chữ số).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const districtName = districtOptions.find(d => d.value === districtId)?.label || '';
      await registerWithCredentials({
        name: fullName.trim(),
        phone: phone.trim(),
        password: password.trim(),
        email: email.trim() || undefined,
        districtId,
        districtName,
        addressDetail,
      });
      setLoading(false);
    } catch (apiErr: any) {
      // If server is not running or other error, fallback to local register
      register(fullName, phone, email, districtId, addressDetail);
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Back to Login */}
      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <Text style={styles.title}>Đăng ký thành viên</Text>
      <Text style={styles.subtitle}>Cùng gia nhập cộng đồng mẹ bỉm văn minh, chia sẻ đồ dùng hữu ích cho con.</Text>

      <View style={styles.form}>
        <FormError message={error} />

        <Input
          label="Họ và tên mẹ"
          placeholder="VD: Mẹ Nguyễn Lan"
          value={fullName}
          onChangeText={setFullName}
          icon={<User size={20} color={COLORS.outline} />}
        />

        <Input
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          icon={<Phone size={20} color={COLORS.outline} />}
        />

        <Input
          label="Email"
          placeholder="Nhập địa chỉ email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Mail size={20} color={COLORS.outline} />}
        />

        <Input
          label="Mật khẩu"
          placeholder="Tạo mật khẩu đăng nhập"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          icon={<Lock size={20} color={COLORS.outline} />}
        />

        <FormSelect
          label="Khu vực ở Đà Nẵng (Pilot)"
          placeholder="Chọn Quận/Huyện"
          options={districtOptions}
          selectedValue={districtId}
          onValueChange={setDistrictId}
          error={error && !districtId ? 'Chọn quận ở' : undefined}
        />

        <Input
          label="Địa chỉ chi tiết (Chung cư/Đường/Số nhà)"
          placeholder="VD: P1505 Chung cư Azura, Sơn Trà"
          value={addressDetail}
          onChangeText={setAddressDetail}
          icon={<MapPin size={20} color={COLORS.outline} />}
        />

        <Button
          title="Tạo tài khoản & nhận 15 Xu"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Đã có tài khoản?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Đăng nhập</Text>
        </TouchableOpacity>
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
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
  },
  backBtn: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.headlineLg,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  form: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  registerBtn: {
    marginTop: SPACING.md,
    height: 54,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
export default RegisterScreen;
