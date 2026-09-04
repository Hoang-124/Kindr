// src/components/layout/Header.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../app/providers/AuthProvider';

import { ScalePressable } from '../common/ScalePressable';
import { PulseBadge } from '../common/PulseBadge';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showProfileSummary?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export const Header = ({
  title,
  showBack = false,
  showProfileSummary = false,
  onBackPress,
  rightElement,
}: HeaderProps) => {
  const navigation = useNavigation<any>();
  const { currentUser } = useAuth();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Left Slot */}
      <View style={styles.leftSlot}>
        {showBack ? (
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButton} 
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : showProfileSummary && currentUser ? (
          <ScalePressable
            style={styles.profileSummary}
            scaleTo={0.97}
            onPress={() => (navigation as any).navigate('Profile')}
          >
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.greeting}>Chào mẹ,</Text>
              <Text style={styles.username} numberOfLines={1}>{currentUser.name}</Text>
            </View>
          </ScalePressable>
        ) : title ? (
          <Text style={styles.leftTitleText} numberOfLines={1}>{title}</Text>
        ) : (
          <Text style={styles.brandText}>Kindr</Text>
        )}
      </View>

      {/* Center Slot - only on sub-screens with showBack for centered detail title */}
      {showBack && title ? (
        <View style={styles.centerSlot}>
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        </View>
      ) : null}

      {/* Right Slot */}
      <View style={styles.rightSlot}>
        {rightElement ? (
          rightElement
        ) : showProfileSummary && currentUser ? (
          <ScalePressable
            scaleTo={0.93}
            onPress={() => navigation.navigate('Wallet')}
          >
            <View style={styles.walletContainer}>
              <PulseBadge scaleMin={0.92} scaleMax={1.1} duration={2000}>
                <Text style={styles.walletTokenSymbol}>🪙</Text>
              </PulseBadge>
              <Text style={styles.walletBalance}>{currentUser.xuBalance} Xu</Text>
            </View>
          </ScalePressable>
        ) : showBack ? (
          // Spacer matching backButton size to ensure true center alignment
          <View style={styles.spacer} />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  leftSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  leftTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  centerSlot: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceDim,
  },
  welcomeTextContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    ...SHADOWS.soft,
  },
  walletTokenSymbol: {
    fontSize: 13,
  },
  walletBalance: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C6500',
  },
  spacer: {
    width: 40,
    height: 40,
  },
});
export default Header;
