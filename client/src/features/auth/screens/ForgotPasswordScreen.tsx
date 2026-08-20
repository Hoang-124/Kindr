// src/features/auth/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import { Mail, Phone, ShieldAlert, Key } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState<1 | 2>(1); // 1: Send OTP, 2: Reset Password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = () => {
    if (!username.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại để nhận mã OTP.');
      return;
    }
    
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setStep(2);
      Alert.alert(
        'Đã gửi mã OTP 💬',
        `Hệ thống đã gửi mã OTP xác thực đến: ${username}. Hãy sử dụng mã OTP mặc định là "123456" để tiếp tục.`,
        [{ text: 'Đồng ý' }]
      );
    }, 1000);
  };

  const handleResetPassword = () => {
    setError('');

    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    if (otp !== '123456') {
      setError('Mã OTP không chính xác. Vui lòng nhập "123456" để tiếp tục thử nghiệm.');
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Vui lòng điền đầy đủ mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có độ dài từ 6 ký tự trở lên.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Thành công! 🎉',
        'Mật khẩu của mẹ đã được thay đổi thành công. Hãy đăng nhập bằng mật khẩu mới này nhé.',
        [
          { 
            text: 'Đăng nhập ngay', 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
    }, 1000);
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Khôi phục mật khẩu" showBack onBackPress={() => {
        if (step === 2) {
          setStep(1);
        } else {
          navigation.goBack();
        }
      }} />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotWrapper}>
          <ShieldAlert size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Quên mật khẩu?</Text>
        <Text style={styles.subtitle}>
          {step === 1 
            ? 'Đừng lo lắng, hãy nhập số điện thoại hoặc email liên kết với tài khoản của mẹ để nhận mã khôi phục.'
            : 'Nhập mã OTP đã được gửi và thiết lập mật khẩu mới của mẹ.'}
        </Text>

        <View style={styles.form}>
          <FormError message={error} />

          {step === 1 ? (
            <>
              <Input
                label="Email hoặc Số điện thoại"
                placeholder="VD: hoalan@gmail.com hoặc 0905123456"
                value={username}
                onChangeText={setUsername}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Phone size={20} color={COLORS.outline} />}
              />

              <Button
                title="Gửi mã xác thực OTP"
                onPress={handleSendOTP}
                loading={loading}
                style={styles.actionBtn}
              />
            </>
          ) : (
            <>
              <Input
                label="Mã xác thực OTP (Nhập 123456)"
                placeholder="VD: 123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                icon={<Key size={20} color={COLORS.outline} />}
              />

              <Input
                label="Mật khẩu mới"
                placeholder="Nhập tối thiểu 6 ký tự"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                icon={<Key size={20} color={COLORS.outline} />}
              />

              <Input
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                icon={<Key size={20} color={COLORS.outline} />}
              />

              <Button
                title="Đổi mật khẩu & Đăng nhập"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.actionBtn}
              />
            </>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.backToLogin}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backToLoginText}>Quay lại trang Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
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
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mascotWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.ambient,
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
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    lineHeight: 18,
  },
  form: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    marginTop: SPACING.md,
    height: 52,
  },
  backToLogin: {
    paddingVertical: SPACING.sm,
  },
  backToLoginText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
