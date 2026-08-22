// src/components/layout/Header.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useAuth } from '../../app/providers/AuthProvider';

import { ScalePressable } from '../common/ScalePressable';
import { PulseBadge } from '../common/PulseBadge';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showProfileSummary?: boolean;
  onBackPress?: () => void;
}

export const Header = ({
  title,
  showBack = false,
  showProfileSummary = false,
  onBackPress,
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
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.primary} />
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
            <Text style={styles.username}>{currentUser.name}</Text>
          </View>
        </ScalePressable>
      ) : (
        <Text style={styles.titleText}>{title || 'Kindr'}</Text>
      )}

      {showProfileSummary && currentUser && (
        <ScalePressable
          scaleTo={0.93}
          onPress={() => navigation.navigate('Wallet')}
        >
          <View style={styles.walletContainer}>
            <PulseBadge scaleMin={0.9} scaleMax={1.12} duration={2000}>
              <Text style={styles.walletTokenSymbol}>🪙</Text>
            </PulseBadge>
            <Text style={styles.walletBalance}>{currentUser.xuBalance} Xu</Text>
          </View>
        </ScalePressable>
      )}

      {!showProfileSummary && title && showBack && <Text style={styles.centerTitle}>{title}</Text>}
      {/* Spacer to balance back button */}
      {showBack && !title && <View style={styles.spacer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 103, 88, 0.05)',
  },
  backButton: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
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
    fontSize: 12,
    color: COLORS.outline,
    fontWeight: '500',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  centerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
    pointerEvents: 'none',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 20,
    ...SHADOWS.soft,
  },
  walletTokenSymbol: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.tertiary,
  },
  walletBalance: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSecondaryContainer,
  },
  spacer: {
    width: 32,
  },
});
export default Header;
