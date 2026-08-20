// src/features/auth/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../../theme';
import Button from '../../../components/common/Button';
import { ArrowRight, Coins, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: "Đổi đồ bằng Xu, không mặc cả",
    description: "Mẹ đăng đồ cũ để nhận Xu, rồi dùng Xu đổi món đồ khác cho bé gần nhà.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-IBwqPJodx0bhjMMtWBnEumH7CeEcHYYNiqYBjoUEkj_qabxH1ALcHtHutYeWwIptQR6GxxKV7gTwxdAEB3hciMyjSGBfED7xp6UB8CFORG2YOpZQx5ImXldDdbnBtebM5tpxgqEdV0vGy0z2q6krWUFnknd7cSIscsvGP5vbVKlpI_qOK0MHnQ2yvj2GjFvoylJnNRCIfge7nU2T6bJ-Zzxre4lB1WjZvVBBJA1b1MyLen5e6NqPzVFRFeh-l9kmMfDOe5rIhOGQ",
    icon: Coins,
    iconColor: COLORS.tertiary,
  },
  {
    title: "Gấu giữ Xu giúp mẹ",
    description: "Xu giao dịch được khóa tại Trạm tạm khóa Kindr, chỉ giải phóng khi mẹ xác nhận nhận đúng đồ mô tả.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-IBwqPJodx0bhjMMtWBnEumH7CeEcHYYNiqYBjoUEkj_qabxH1ALcHtHutYeWwIptQR6GxxKV7gTwxdAEB3hciMyjSGBfED7xp6UB8CFORG2YOpZQx5ImXldDdbnBtebM5tpxgqEdV0vGy0z2q6krWUFnknd7cSIscsvGP5vbVKlpI_qOK0MHnQ2yvj2GjFvoylJnNRCIfge7nU2T6bJ-Zzxre4lB1WjZvVBBJA1b1MyLen5e6NqPzVFRFeh-l9kmMfDOe5rIhOGQ",
    icon: ShieldCheck,
    iconColor: COLORS.primary,
  },
  {
    title: "Dọn nhà bé thật gọn gàng",
    description: "Những món đồ bé không dùng nữa có thể trở thành niềm vui mới cho một gia đình khác.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDY5e6B1mGx7x5CcjKVmBQmewKNU-dw_qlF270owyzwp01YC3mi1CftcV-n6F6anUW72w29d70ztTgRnJgzEDDZolPT1dHLfTYCWyOdin_JNmAUq5P_oZG77p5cysqIcCE5x-QtwV0G9OVWFD21S_SRlSK3H7FtfIN_8TrISe35r1DzjdN0e4BZAK2y8BIMTpZ2xahA5YpjUmlLgaCQUWl-pxJLH8d3wNozC1et3Rced7JzTI_MUwKT4jvMG46zARwRUnPMpttpOEgW",
    icon: null,
    iconColor: null,
  }
];

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigation = useNavigation<NavigationProp>();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const SlideIcon = slides[currentSlide].icon;

  return (
    <View style={styles.container}>
      {/* Background shape decoration */}
      <View style={[
        styles.bgShape,
        currentSlide === 0 ? styles.bgCircle :
        currentSlide === 1 ? styles.bgSquare : styles.bgFull
      ]} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        <View style={[
          styles.imageWrapper,
          currentSlide === 2 ? styles.imageLarge : styles.imageCircle
        ]}>
          <Image 
            source={{ uri: slides[currentSlide].image }} 
            style={styles.image} 
            resizeMode={currentSlide === 2 ? 'cover' : 'contain'}
          />
          
          {/* Decorative Floating Icon */}
          {SlideIcon && (
            <View style={styles.decorIcon}>
              <SlideIcon size={28} color={slides[currentSlide].iconColor || COLORS.primary} />
            </View>
          )}
        </View>

        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.description}>{slides[currentSlide].description}</Text>
      </View>

      {/* Footer controls */}
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.indicator,
                i === currentSlide ? styles.activeIndicator : null
              ]}
            />
          ))}
        </View>

        <Button 
          title={currentSlide === slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp theo'}
          onPress={handleNext}
          style={styles.btn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 40,
    paddingHorizontal: SPACING.containerPadding,
  },
  bgShape: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    backgroundColor: COLORS.surfaceContainer,
    opacity: 0.5,
    borderRadius: RADIUS.full,
    zIndex: -1,
  },
  bgCircle: {
    borderRadius: RADIUS.full,
    transform: [{ scale: 1.0 }],
  },
  bgSquare: {
    borderRadius: 40,
    transform: [{ scale: 1.1 }],
  },
  bgFull: {
    width: '150%',
    height: '150%',
    top: -100,
    borderRadius: 200,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.15,
  },
  header: {
    alignItems: 'flex-end',
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  skipText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.outline,
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  imageWrapper: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  imageCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: '#ffffff',
    padding: SPACING.md,
  },
  imageLarge: {
    width: width - 40,
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  decorIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.full,
    padding: SPACING.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    ...TYPOGRAPHY.displayLg,
    color: COLORS.onBackground,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontSize: 26,
    fontWeight: '700',
  },
  description: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 290,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.xl,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.outlineVariant,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  btn: {
    height: 54,
  },
});
export default OnboardingScreen;
