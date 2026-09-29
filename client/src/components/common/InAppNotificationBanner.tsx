// src/components/common/InAppNotificationBanner.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform 
} from 'react-native';
import { MessageSquare, X, ChevronRight, ShieldAlert, ShieldCheck, Bell } from 'lucide-react-native';
import { socketService } from '../../services/socketService';
import { useAppSelector } from '../../app/store/hooks';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import { Avatar } from './Avatar';
import { PulseBadge } from './PulseBadge';

interface BannerData {
  type: 'chat' | 'dispute_opened' | 'dispute_resolved' | 'system';
  chatId?: string;
  transactionId?: string;
  senderName: string;
  senderAvatar?: string;
  title: string;
  content: string;
}

// Global refs to navigate
let navigateHandler: ((chatId: string) => void) | null = null;
export function registerNotificationNavigator(handler: (chatId: string) => void) {
  navigateHandler = handler;
}

let navigateTransactionHandler: ((transactionId: string) => void) | null = null;
export function registerTransactionNavigator(handler: (transactionId: string) => void) {
  navigateTransactionHandler = handler;
}

export const InAppNotificationBanner: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [banner, setBanner] = useState<BannerData | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const dismissTimerRef = useRef<any>(null);

  const showBanner = (data: BannerData) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setBanner(data);

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
      tension: 60,
      friction: 8,
    }).start();

    // Auto dismiss after 5.5 seconds
    dismissTimerRef.current = setTimeout(() => {
      hideBanner();
    }, 5500);
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setBanner(null);
    });
  };

  useEffect(() => {
    if (!currentUser) return;

    // Listen to real-time notification events
    const handleNewNotification = (notif: any) => {
      // 1. Chat message notification
      if (notif.type === 'chat_message' && notif.data?.chatId) {
        if (notif.data.senderId === currentUser.id) return;

        showBanner({
          type: 'chat',
          chatId: notif.data.chatId,
          title: 'Tin nhắn mới',
          senderName: notif.data.senderName || notif.title?.replace('Tin nhắn từ ', '') || 'Mẹ bỉm',
          senderAvatar: notif.data.senderAvatar || '',
          content: notif.body || 'Đã gửi cho bạn một tin nhắn',
        });
        return;
      }

      // 2. Dispute opened notification
      if (notif.type === 'dispute_opened') {
        const txId = notif.relatedTransactionId?._id?.toString() || notif.relatedTransactionId?.toString() || notif.data?.transactionId;
        showBanner({
          type: 'dispute_opened',
          transactionId: txId,
          title: notif.title || 'Khiếu nại đơn hàng ⚠️',
          senderName: 'Bảo Vệ Đơn Hàng',
          content: notif.body || 'Có khiếu nại mới cần chú ý',
        });
        return;
      }

      // 3. Dispute resolved notification
      if (notif.type === 'dispute_resolved') {
        const txId = notif.relatedTransactionId?._id?.toString() || notif.relatedTransactionId?.toString() || notif.data?.transactionId;
        showBanner({
          type: 'dispute_resolved',
          transactionId: txId,
          title: notif.title || 'Phán quyết khiếu nại 🎉',
          senderName: 'Ban Quản Trị Kindr',
          content: notif.body || 'Tranh chấp đã có kết quả phân xử chính thức',
        });
        return;
      }
    };

    // Listen to incoming messages across socket
    const handleMessageReceived = (payload: any) => {
      const msg = payload.message || payload;
      const rawSenderId = msg.senderId?._id?.toString() || msg.senderId?.toString() || msg.senderId;

      if (rawSenderId && rawSenderId !== currentUser.id) {
        showBanner({
          type: 'chat',
          chatId: payload.chatId || msg.chatId,
          title: 'Tin nhắn mới',
          senderName: msg.senderName || 'Mẹ bỉm',
          senderAvatar: msg.senderAvatar || '',
          content: msg.content || 'Đã gửi một tin nhắn mới',
        });
      }
    };

    socketService.on('notification_new', handleNewNotification);
    socketService.on('notification', handleNewNotification);
    socketService.on('message_received', handleMessageReceived);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      socketService.off('notification_new', handleNewNotification);
      socketService.off('notification', handleNewNotification);
      socketService.off('message_received', handleMessageReceived);
    };
  }, [currentUser]);

  if (!banner) return null;

  const handlePress = () => {
    hideBanner();
    if ((banner.type === 'dispute_opened' || banner.type === 'dispute_resolved') && banner.transactionId) {
      if (navigateTransactionHandler) {
        navigateTransactionHandler(banner.transactionId);
      }
      return;
    }

    if (banner.chatId && navigateHandler) {
      navigateHandler(banner.chatId);
    }
  };

  const isDispute = banner.type === 'dispute_opened' || banner.type === 'dispute_resolved';

  return (
    <Animated.View style={[styles.floatingContainer, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity 
        style={[
          styles.card,
          banner.type === 'dispute_opened' && styles.cardDisputeOpened,
          banner.type === 'dispute_resolved' && styles.cardDisputeResolved,
        ]} 
        onPress={handlePress}
        activeOpacity={0.92}
      >
        {/* Left Avatar / Icon */}
        {isDispute ? (
          <View style={[
            styles.iconWrapper, 
            banner.type === 'dispute_opened' ? styles.iconWrapWarning : styles.iconWrapSuccess
          ]}>
            <PulseBadge scaleMin={0.9} scaleMax={1.2} duration={1200}>
              {banner.type === 'dispute_opened' ? (
                <ShieldAlert size={22} color="#DC2626" />
              ) : (
                <ShieldCheck size={22} color="#10B981" />
              )}
            </PulseBadge>
          </View>
        ) : (
          <View style={styles.avatarWrapper}>
            <Avatar 
              uri={banner.senderAvatar} 
              name={banner.senderName} 
              size={42} 
              showBorder 
              borderColor={COLORS.primary}
            />
            <View style={styles.pingIconBadge}>
              <PulseBadge scaleMin={0.9} scaleMax={1.25} duration={1200}>
                <View style={styles.iconPingInner}>
                  <MessageSquare size={10} color="#FFFFFF" />
                </View>
              </PulseBadge>
            </View>
          </View>
        )}

        {/* Content Preview */}
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <Text style={styles.senderName} numberOfLines={1}>
              {banner.senderName}
            </Text>
            <View style={[
              styles.tagPill,
              banner.type === 'dispute_opened' && { backgroundColor: '#FEE2E2' },
              banner.type === 'dispute_resolved' && { backgroundColor: '#D1FAE5' },
            ]}>
              <Text style={[
                styles.tagText,
                banner.type === 'dispute_opened' && { color: '#DC2626' },
                banner.type === 'dispute_resolved' && { color: '#059669' },
              ]}>
                {banner.title}
              </Text>
            </View>
          </View>
          <Text style={styles.messageContent} numberOfLines={2}>
            {banner.content}
          </Text>
        </View>

        {/* Action Button & Dismiss */}
        <View style={styles.rightActions}>
          <View style={[
            styles.replyChip,
            banner.type === 'dispute_opened' && { backgroundColor: '#FEE2E2' },
            banner.type === 'dispute_resolved' && { backgroundColor: '#D1FAE5' },
          ]}>
            <Text style={[
              styles.replyText,
              banner.type === 'dispute_opened' && { color: '#DC2626' },
              banner.type === 'dispute_resolved' && { color: '#059669' },
            ]}>
              Xem
            </Text>
            <ChevronRight 
              size={14} 
              color={banner.type === 'dispute_opened' ? '#DC2626' : banner.type === 'dispute_resolved' ? '#059669' : COLORS.primary} 
            />
          </View>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              hideBanner();
            }} 
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 20,
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 99999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    ...SHADOWS.card,
    gap: SPACING.sm,
  },
  cardDisputeOpened: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: '#FFFDFD',
  },
  cardDisputeResolved: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: '#F7FEFA',
  },
  avatarWrapper: {
    position: 'relative',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapWarning: {
    backgroundColor: '#FEE2E2',
  },
  iconWrapSuccess: {
    backgroundColor: '#D1FAE5',
  },
  pingIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  iconPingInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  tagPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  messageContent: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 1,
  },
  replyText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 2,
  },
});

export default InAppNotificationBanner;
