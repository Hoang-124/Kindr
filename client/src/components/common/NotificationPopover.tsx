// src/components/common/NotificationPopover.tsx
import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { markAsRead, markAllAsRead, setNotifications } from '../../features/notification/store/notificationSlice';
import * as notificationService from '../../services/notificationService';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';
import {
  Bell,
  X,
  CheckCheck,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Coins,
  Package,
  Award,
  MessageSquare,
  ChevronRight,
} from 'lucide-react-native';
import { Avatar } from './Avatar';
import { Notification } from '../../types/notification';

interface NotificationPopoverProps {
  visible: boolean;
  onClose: () => void;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Vừa xong';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const allNotifications = useAppSelector((state) => state.notification.notifications);
  // Strictly exclude private chat messages from the Notification Bell popover
  const notifications = allNotifications.filter(
    (item) => item.type !== 'chat_message' && item.type !== 'message' && item.type !== 'new_message'
  );
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  useEffect(() => {
    if (visible && currentUser) {
      notificationService.getNotifications(1, 20)
        .then(({ notifications: items }) => {
          dispatch(setNotifications(items));
        })
        .catch(() => {});
    }
  }, [visible, currentUser, dispatch]);

  const handleNotificationPress = (item: Notification) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
      notificationService.markAsRead(item.id).catch(() => {});
    }

    onClose();

    const productId = item.relatedProductId || item.data?.productId;
    const transactionId = item.relatedTransactionId || item.data?.transactionId;

    if (item.type === 'post_pending_admin') {
      if (currentUser?.role === 'admin') {
        if (productId) {
          navigation.navigate('ProductDetail', { id: productId });
        } else {
          navigation.navigate('ManagePosts');
        }
        return;
      }
    }

    const chatId = item.data?.chatId;
    if (chatId) {
      navigation.navigate('ChatDetail', { chatId });
      return;
    }

    if (item.type === 'message' || item.type === 'new_message' || item.type === 'chat_message') {
      navigation.navigate('ChatList');
      return;
    }

    if (transactionId) {
      navigation.navigate('TransactionDetail', { id: transactionId });
      return;
    }

    if (item.type === 'match_request' || item.type === 'trade' || item.type === 'safeful_time_started') {
      if (transactionId) {
        navigation.navigate('TransactionDetail', { id: transactionId });
        return;
      }
      if (productId) {
        navigation.navigate('TransactionDetail', { id: productId });
        return;
      }
    }

    if (productId) {
      navigation.navigate('ProductDetail', { id: productId });
      return;
    }

    if (
      item.type === 'topup_success' ||
      item.type === 'withdraw_approved' ||
      item.type === 'withdraw_rejected' ||
      item.type === 'xu_released'
    ) {
      navigation.navigate('Wallet');
      return;
    }
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllAsRead(currentUser?.id));
    try {
      await notificationService.markAllAsRead();
    } catch (e) {
      console.warn('Mark all read error:', e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post_pending_admin':
        return <ShieldAlert size={16} color="#D97706" />;
      case 'post_approved':
        return <CheckCircle size={16} color="#10B981" />;
      case 'post_rejected':
        return <XCircle size={16} color={COLORS.error} />;
      case 'post_submitted':
        return <Clock size={16} color="#2563EB" />;
      case 'topup_success':
      case 'xu_released':
      case 'welcome_credit':
        return <Coins size={16} color="#10B981" />;
      case 'match_request':
      case 'safeful_time_started':
      case 'trade':
        return <Package size={16} color="#D97706" />;
      case 'dispute_opened':
        return <ShieldAlert size={16} color="#EF4444" />;
      case 'dispute_resolved':
        return <ShieldCheck size={16} color="#10B981" />;
      case 'rating_received':
        return <Award size={16} color="#F59E0B" />;
      case 'message':
      case 'new_message':
        return <MessageSquare size={16} color="#2563eb" />;
      default:
        return <Bell size={16} color={COLORS.primary} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'post_pending_admin':
        return '#FEF3C7';
      case 'post_approved':
        return '#D1FAE5';
      case 'post_rejected':
        return '#FEE2E2';
      case 'post_submitted':
        return '#DBEAFE';
      case 'topup_success':
      case 'xu_released':
      case 'welcome_credit':
        return '#D1FAE5';
      case 'dispute_opened':
        return '#FEE2E2';
      case 'dispute_resolved':
        return '#D1FAE5';
      case 'rating_received':
        return '#FEF3C7';
      case 'message':
      case 'new_message':
        return '#DBEAFE';
      default:
        return COLORS.primaryContainer + '30';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Inner Card stops propagation */}
        <Pressable style={styles.popoverCard} onPress={(e) => e.stopPropagation()}>
          {/* Popover Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Thông Báo</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>{unreadCount} mới</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  onPress={handleMarkAllRead}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <CheckCheck size={14} color={COLORS.primary} />
                  <Text style={styles.markAllText}>Đã đọc</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={16} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Popover Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Bell size={28} color={COLORS.outlineVariant} />
                </View>
                <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
                <Text style={styles.emptySubtitle}>
                  {currentUser?.role === 'admin'
                    ? 'Khi có bài đăng mới cần duyệt, thông báo sẽ xuất hiện tại đây.'
                    : 'Các cập nhật về tin đăng, đổi đồ và ví Xu sẽ xuất hiện ở đây mẹ nhé.'}
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    !item.isRead && styles.itemCardUnread,
                  ]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.7}
                >
                  {item.type === 'chat_message' && (item.data?.senderAvatar || item.data?.senderName) ? (
                    <View style={styles.senderAvatarWrap}>
                      <Avatar
                        uri={item.data?.senderAvatar}
                        name={item.data?.senderName || item.title}
                        size={36}
                      />
                      <View style={styles.chatIconBadge}>
                        <MessageSquare size={9} color="#FFFFFF" />
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.itemIconWrap, { backgroundColor: getIconBg(item.type) }]}>
                      {getIcon(item.type)}
                    </View>
                  )}

                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <Text
                        style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.body}
                    </Text>
                    <Text style={styles.itemTime}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer View All */}
          <TouchableOpacity
            style={styles.footerViewAll}
            onPress={() => {
              onClose();
              navigation.navigate('Notification');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.footerViewAllText}>Xem tất cả thông báo</Text>
            <ChevronRight size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 56 : 52,
    paddingRight: 12,
  },
  popoverCard: {
    width: Math.min(360, windowWidth - 24),
    maxHeight: 480,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  unreadPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  unreadPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: 410,
  },
  scrollContent: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.outline,
    textAlign: 'center',
    lineHeight: 16,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 10,
  },
  itemCardUnread: {
    backgroundColor: '#FFF8F8',
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  senderAvatarWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  chatIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5252',
    marginLeft: 6,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '500',
  },
  footerViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FAFBFB',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 4,
  },
  footerViewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default NotificationPopover;
