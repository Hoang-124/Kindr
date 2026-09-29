import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { 
  setNotifications, 
  addNotification, 
  markAsRead, 
  markAllAsRead 
} from '../store/notificationSlice';
import * as notificationService from '../../../services/notificationService';
import { socketService } from '../../../services/socketService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { 
  Bell, 
  Info, 
  MessageSquare, 
  Award, 
  CheckCircle, 
  Trash2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Clock,
  Coins,
  Package,
  Sparkles
} from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import { Notification } from '../../../types/notification';

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

export const NotificationScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const allNotifications = useAppSelector((state) => state.notification.notifications);
  const notifications = allNotifications.filter(
    (n) => n.type !== 'chat_message' && n.type !== 'message' && n.type !== 'new_message'
  );
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (isPullToRefresh = false) => {
    if (!isPullToRefresh) setLoading(true);
    try {
      const { notifications: items } = await notificationService.getNotifications(1, 50);
      if (Array.isArray(items)) {
        dispatch(setNotifications(items));
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleNewNotif = (notif: any) => {
      const normalized: Notification = {
        id: notif.id || notif._id?.toString() || 'n_' + Date.now(),
        userId: notif.userId?.toString() || '',
        title: notif.title || 'Thông báo mới',
        body: notif.body || '',
        type: notif.type || 'system',
        isRead: false,
        relatedProductId: notif.relatedProductId?._id?.toString() || notif.relatedProductId?.toString() || notif.data?.productId,
        relatedTransactionId: notif.relatedTransactionId?._id?.toString() || notif.relatedTransactionId?.toString() || notif.data?.transactionId,
        createdAt: notif.createdAt || new Date().toISOString(),
      };
      dispatch(addNotification(normalized));
    };

    socketService.on('notification_new', handleNewNotif);
    socketService.on('notification', handleNewNotif);

    return () => {
      socketService.off('notification_new', handleNewNotif);
      socketService.off('notification', handleNewNotif);
    };
  }, []);

  const handleNotificationPress = async (item: Notification) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
      notificationService.markAsRead(item.id).catch(() => {});
    }

    // Smart context-aware navigation
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

    if (transactionId) {
      navigation.navigate('TransactionDetail', { id: transactionId });
      return;
    }

    if (item.type === 'match_request' || item.type === 'trade' || item.type === 'safeful_time_started') {
      if (productId) {
        navigation.navigate('TransactionDetail', { id: productId });
        return;
      }
    }

    if (productId) {
      navigation.navigate('ProductDetail', { id: productId });
      return;
    }

    if (item.type === 'topup_success' || item.type === 'withdraw_approved' || item.type === 'withdraw_rejected' || item.type === 'xu_released') {
      navigation.navigate('Wallet');
      return;
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Đánh dấu đã đọc tất cả?',
      'Bạn có muốn đánh dấu toàn bộ thông báo là đã đọc?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          onPress: async () => {
            dispatch(markAllAsRead(currentUser?.id));
            try {
              await notificationService.markAllAsRead();
            } catch (e) {
              console.warn('Mark all as read error:', e);
            }
          } 
        }
      ]
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post_pending_admin':
        return <ShieldAlert size={18} color="#D97706" />;
      case 'post_approved':
        return <CheckCircle size={18} color="#10B981" />;
      case 'post_rejected':
        return <XCircle size={18} color={COLORS.error} />;
      case 'post_submitted':
        return <Clock size={18} color="#2563EB" />;
      case 'topup_success':
      case 'xu_released':
      case 'welcome_credit':
        return <Coins size={18} color="#10B981" />;
      case 'match_request':
      case 'safeful_time_started':
      case 'trade':
        return <Package size={18} color="#D97706" />;
      case 'dispute_opened':
        return <ShieldAlert size={18} color="#EF4444" />;
      case 'dispute_resolved':
        return <ShieldCheck size={18} color="#10B981" />;
      case 'rating_received':
        return <Award size={18} color="#F59E0B" />;
      case 'message':
      case 'new_message':
        return <MessageSquare size={18} color="#2563eb" />;
      default:
        return <Bell size={18} color={COLORS.primary} />;
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
    <ScreenContainer scrollable={false}>
      <Header 
        title="Thông Báo" 
        showBack 
        showNotificationBell={false}
      />

      {notifications.length > 0 && (
        <View style={styles.clearHeader}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll} activeOpacity={0.7}>
            <CheckCircle size={14} color={COLORS.primary} />
            <Text style={styles.clearBtnText}>Đánh dấu đã đọc tất cả</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadNotifications(true);
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Bell size={40} color={COLORS.outlineVariant} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptyText}>
                {currentUser?.role === 'admin'
                  ? 'Khi có thành viên đăng đồ hoặc yêu cầu phê duyệt mới, thông báo sẽ hiển thị tại đây.'
                  : 'Mọi cập nhật về tin đăng, đổi đồ và ví Xu sẽ xuất hiện ở đây mẹ nhé.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.notiCard,
                !item.isRead && styles.notiCardUnread
              ]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, { backgroundColor: getIconBg(item.type) }]}>
                {getIcon(item.type)}
              </View>

              <View style={styles.notiContent}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notiTitle, !item.isRead && styles.textBold]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notiBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.notiTime}>
                  {formatRelativeTime(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xs,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.outline,
  },
  clearHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.containerPadding,
    paddingVertical: SPACING.sm,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceDim,
  },
  clearBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  notiCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.soft,
  },
  notiCardUnread: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: '#FFFBFB',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  notiContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  textBold: {
    fontWeight: '800',
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    marginLeft: 6,
  },
  notiBody: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },
  notiTime: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '500',
  },
});

export default NotificationScreen;
