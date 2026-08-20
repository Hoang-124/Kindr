import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as notificationService from '../../../services/notificationService';
import { socketService } from '../../../services/socketService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { Bell, Info, MessageSquare, Award, CheckCircle, Trash2 } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'message' | 'trade' | 'civ' | 'sys';
  time: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Giao dịch thành công 🎉',
    body: 'Đơn hàng "Set 3 bộ body suit nous" đã được hoàn tất. Chúc bé mặc ngoan chóng lớn!',
    type: 'trade',
    time: '2 giờ trước',
    isRead: false,
  },
  {
    id: 'n2',
    title: 'Mẹ Bắp đã gửi tin nhắn 💬',
    body: '"Ok mẹ nè, mình đã duyệt và bàn giao rồi đó. Mẹ check giúp mình."',
    type: 'message',
    time: '5 giờ trước',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'Cộng điểm Mẹ Bỉm Văn Minh 🌟',
    body: 'Mẹ được cộng +5 điểm vì bàn giao đồ chơi gỗ đúng hẹn cho Mẹ Bắp.',
    type: 'civ',
    time: '1 ngày trước',
    isRead: true,
  },
  {
    id: 'n4',
    title: 'Chào mừng mẹ đến với Kindr! 👶',
    body: 'Nhận ngay 15 Xu làm vốn để bắt đầu trao đổi đồ cũ bảo chứng văn minh mẹ nhé.',
    type: 'sys',
    time: '3 ngày trước',
    isRead: true,
  },
];

export const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    notificationService.getNotifications()
      .then(({ notifications: items }) => {
        if (items && items.length > 0) {
          const mapped: NotificationItem[] = items.map(n => ({
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type.includes('message') ? 'message' : n.type.includes('safeful') || n.type.includes('xu') ? 'trade' : 'sys',
            time: 'Gần đây',
            isRead: n.isRead,
          }));
          setNotifications(mapped);
        }
      })
      .catch(() => {
        // keep fallback
      });

    const handleNewNotif = (notif: any) => {
      setNotifications(prev => [
        {
          id: notif.id || notif._id || 'n_' + Date.now(),
          title: notif.title,
          body: notif.body,
          type: 'trade',
          time: 'Vừa xong',
          isRead: false,
        },
        ...prev,
      ]);
    };

    socketService.on('notification_new', handleNewNotif);
    return () => {
      socketService.off('notification_new', handleNewNotif);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
    } catch (e) {
      // local fallback
    }
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Xóa tất cả thông báo? 🗑️',
      'Mẹ muốn đánh dấu đã đọc toàn bộ lịch sử thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          onPress: async () => {
            try {
              await notificationService.markAllAsRead();
            } catch (e) {}
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          } 
        }
      ]
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={18} color="#2563eb" />;
      case 'trade':
        return <CheckCircle size={18} color={COLORS.primary} />;
      case 'civ':
        return <Award size={18} color={COLORS.accentGold} />;
      default:
        return <Info size={18} color={COLORS.outline} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'message':
        return '#dbeafe';
      case 'trade':
        return COLORS.primaryContainer + '40';
      case 'civ':
        return '#fef3c7';
      default:
        return COLORS.surfaceContainer;
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header 
        title="Thông Báo Của Mẹ" 
        showBack 
      />

      {notifications.length > 0 && (
        <View style={styles.clearHeader}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Trash2 size={14} color={COLORS.error} />
            <Text style={styles.clearBtnText}>Xóa tất cả</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={COLORS.outlineVariant} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Mẹ không có thông báo mới nào.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notiCard,
              !item.isRead && styles.notiCardUnread
            ]}
            onPress={() => handleMarkAsRead(item.id)}
            activeOpacity={0.8}
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
                {item.time}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xs,
    paddingBottom: 40,
  },
  clearHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.containerPadding,
    paddingVertical: SPACING.sm,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.errorContainer + '20',
  },
  clearBtnText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
  },
  notiCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.soft,
  },
  notiCardUnread: {
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.primaryContainer + '08',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
  },
  textBold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  notiBody: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    lineHeight: 15,
    marginBottom: 6,
  },
  notiTime: {
    fontSize: 9,
    color: COLORS.outline,
    fontWeight: '500',
  },
});

export default NotificationScreen;
