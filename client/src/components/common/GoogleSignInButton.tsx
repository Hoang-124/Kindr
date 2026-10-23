// src/components/common/GoogleSignInButton.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';
import Svg, { Path } from 'react-native-svg';

export const GOOGLE_CLIENT_ID = '616320462696-2gh4jaj1pafnatlujrqurv043cada6b8.apps.googleusercontent.com';

export interface GoogleSignInButtonProps {
  onSuccess?: (data: {
    credential?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }) => void;
  onError?: (err: string) => void;
  onPress?: () => void;
  title?: string;
  style?: any;
  wrapperStyle?: any;
  compact?: boolean;
  tone?: 'default' | 'warm' | 'coral';
}

const PRESET_GOOGLE_ACCOUNTS = [
  {
    name: 'Mẹ Minh Anh',
    email: 'minhanh.dn@gmail.com',
    googleId: 'google_minhanh_dn_01',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    badge: 'Mẹ Bỉm Hải Châu · Uy tín 5.0',
  },
  {
    name: 'Mẹ Thu Hà',
    email: 'thuha.mommy@gmail.com',
    googleId: 'google_thuha_dn_02',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    badge: 'Mẹ Bỉm Sơn Trà · Uy tín 4.9',
  },
  {
    name: 'Ban Quản Trị Kindr (Admin)',
    email: 'hoang@kindr.vn',
    googleId: 'google_admin_kindr_01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    badge: 'Tài khoản Quản trị viên',
  },
];

// Official Google G Logo SVG
export const GoogleGLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.77l7.97-6.18z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </Svg>
);

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  onPress,
  title = 'Tiếp tục với Google',
  style,
  wrapperStyle,
  compact = false,
  tone = 'warm',
}) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [useCustom, setUseCustom] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const scriptId = 'google-gsi-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleOpenPicker = () => {
    if (onPress) {
      onPress();
      return;
    }
    setUseCustom(false);
    setModalVisible(true);
  };

  const handleSelectAccount = (acc: {
    googleId: string;
    email: string;
    name: string;
    avatar: string;
  }) => {
    setModalVisible(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess?.(acc);
    }, 150);
  };

  const handleCustomAccountSubmit = () => {
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      onError?.('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }
    const derivedName =
      customName.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    handleSelectAccount({
      googleId: `google_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: cleanEmail,
      name: derivedName,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    });
  };

  const handleWebOAuthPopup = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const g = (window as any).google;
      if (g?.accounts?.oauth2) {
        const client = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                setModalVisible(false);
                onSuccess?.({
                  googleId: userInfo.sub,
                  email: userInfo.email,
                  name: userInfo.name,
                  avatar: userInfo.picture,
                });
              } catch (fetchErr: any) {
                onError?.(fetchErr.message || 'Lỗi lấy thông tin Google User');
              }
            }
          },
        });
        client.requestAccessToken();
      }
    }
  };

  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper, wrapperStyle]}>
      <TouchableOpacity
        style={[
          styles.googleButton,
          tone === 'warm' && styles.warmButton,
          tone === 'coral' && styles.coralButton,
          compact && styles.compactButton,
          style,
        ]}
        onPress={handleOpenPicker}
        activeOpacity={0.82}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={tone === 'coral' ? '#FFFFFF' : COLORS.primary} />
        ) : (
          <>
            <View style={[styles.iconBadge, tone === 'coral' && styles.iconBadgeCoral]}>
              <GoogleGLogo size={compact ? 17 : 20} />
            </View>
            <Text
              style={[
                styles.buttonText,
                tone === 'warm' && styles.warmButtonText,
                tone === 'coral' && styles.coralButtonText,
                compact && styles.compactButtonText,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <GoogleGLogo size={24} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalTitle}>Đăng nhập bằng Google</Text>
                <Text style={styles.modalSub}>Chọn tài khoản để tiếp tục tới Kindr</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#6B7280' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {!useCustom ? (
              <View style={{ gap: 10 }}>
                {PRESET_GOOGLE_ACCOUNTS.map((acc) => (
                  <TouchableOpacity
                    key={acc.email}
                    style={styles.accountItem}
                    onPress={() => handleSelectAccount(acc)}
                  >
                    <Image source={{ uri: acc.avatar }} style={styles.accountAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountName}>{acc.name}</Text>
                      <Text style={styles.accountEmail}>{acc.email}</Text>
                      <Text style={styles.accountBadge}>{acc.badge}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.customTriggerBtn}
                  onPress={() => setUseCustom(true)}
                >
                  <Text style={styles.customTriggerText}>+ Sử dụng tài khoản Gmail khác...</Text>
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  <TouchableOpacity style={styles.oauthPopupBtn} onPress={handleWebOAuthPopup}>
                    <Text style={styles.oauthPopupText}>Mở cửa sổ Google OAuth2 Popup</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ Gmail (VD: tenban@gmail.com)"
                  placeholderTextColor="#9CA3AF"
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tên hiển thị (VD: Mẹ Bảo Ngọc)"
                  placeholderTextColor="#9CA3AF"
                  value={customName}
                  onChangeText={setCustomName}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F3F4F6', flex: 1 }]}
                    onPress={() => setUseCustom(false)}
                  >
                    <Text style={{ fontWeight: '700', color: '#374151' }}>Quay lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.primary, flex: 1.5 }]}
                    onPress={handleCustomAccountSubmit}
                  >
                    <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>Tiếp tục</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
    marginVertical: SPACING.sm,
  },
  compactWrapper: {
    marginVertical: 0,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    gap: 10,
    ...SHADOWS.soft,
  },
  warmButton: {
    backgroundColor: '#FFF9F7',
    borderColor: 'rgba(255, 107, 107, 0.28)',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.08,
  },
  coralButton: {
    backgroundColor: COLORS.primary,
    borderColor: 'transparent',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.25,
  },
  compactButton: {
    height: 44,
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  iconBadgeCoral: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
  },
  warmButtonText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  compactButtonText: {
    fontSize: 13.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  accountAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  accountEmail: {
    fontSize: 12,
    color: '#4B5563',
  },
  accountBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  customTriggerBtn: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  customTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  oauthPopupBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
  },
  oauthPopupText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
  },
  actionBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GoogleSignInButton;
