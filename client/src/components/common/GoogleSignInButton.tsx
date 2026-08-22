// src/components/common/GoogleSignInButton.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';
import Svg, { Path } from 'react-native-svg';

export const GOOGLE_CLIENT_ID = '616320462696-2gh4jaj1pafnatlujrqurv043cada6b8.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  onSuccess: (data: { credential?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => void;
  onError?: (err: string) => void;
  title?: string;
  style?: any;
  wrapperStyle?: any;
  compact?: boolean;
}

// Official Google G Logo SVG
const GoogleGLogo = ({ size = 20 }: { size?: number }) => (
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
  title = 'Tiếp tục với Google',
  style,
  wrapperStyle,
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const googleBtnContainerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Load Google Identity Services script if not loaded
    const scriptId = 'google-gsi-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initGsi = () => {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) {
        try {
          g.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              setLoading(false);
              if (response && response.credential) {
                onSuccess({ credential: response.credential });
              } else {
                onError?.('Không nhận được thông tin xác thực Google.');
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render Google GSI standard button into hidden/custom container if available
          if (googleBtnContainerRef.current) {
            g.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'pill',
            });
          }
        } catch (err: any) {
          console.warn('Google GSI init warning:', err);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [onSuccess, onError]);

  const handleCustomClick = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) {
        setLoading(true);
        try {
          g.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              setLoading(false);
              // If One Tap is skipped/dismissed, trigger standard OAuth popup token client
              if (g.accounts.oauth2) {
                const client = g.accounts.oauth2.initTokenClient({
                  client_id: GOOGLE_CLIENT_ID,
                  scope: 'email profile openid',
                  callback: async (tokenResponse: any) => {
                    if (tokenResponse && tokenResponse.access_token) {
                      try {
                        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                        });
                        const userInfo = await userInfoRes.json();
                        onSuccess({
                          googleId: userInfo.sub,
                          email: userInfo.email,
                          name: userInfo.name,
                          avatar: userInfo.picture,
                        });
                      } catch (fetchErr: any) {
                        onError?.(fetchErr.message || 'Lỗi lấy thông tin Google User');
                      }
                    } else {
                      onError?.('Đăng nhập Google bị hủy hoặc thất bại.');
                    }
                    setLoading(false);
                  },
                });
                client.requestAccessToken();
              }
            }
          });
        } catch (err: any) {
          setLoading(false);
          onError?.(err.message || 'Không thể mở cửa sổ đăng nhập Google.');
        }
        return;
      }
    }

    // Fallback demo/mobile trigger
    onError?.('Đang kết nối tới dịch vụ Google...');
  };

  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper, wrapperStyle]}>
      <TouchableOpacity
        style={[styles.googleButton, compact && styles.compactButton, style]}
        onPress={handleCustomClick}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <>
            <GoogleGLogo size={compact ? 18 : 22} />
            <Text style={[styles.buttonText, compact && styles.compactButtonText]}>{title}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Hidden container for official GSI rendered button overlay */}
      {Platform.OS === 'web' && (
        <div
          ref={googleBtnContainerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.001,
            zIndex: 10,
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
        />
      )}
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
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(58, 103, 88, 0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.soft,
  },
  compactButton: {
    height: 44,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C4043',
    letterSpacing: 0.2,
  },
  compactButtonText: {
    fontSize: 13.5,
  },
});

export default GoogleSignInButton;
