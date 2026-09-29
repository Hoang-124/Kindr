import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useAppSelector, useAppDispatch } from '../../app/store/hooks';
import { setNotifications } from '../../features/notification/store/notificationSlice';
import * as notificationService from '../../services/notificationService';
import { COLORS, RADIUS, SHADOWS } from '../../theme';
import { ScalePressable } from './ScalePressable';
import { PulseBadge } from './PulseBadge';
import NotificationPopover from './NotificationPopover';

interface NotificationBellProps {
  color?: string;
  size?: number;
  onPress?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  color = COLORS.text,
  size = 20,
  onPress,
}) => {
  const dispatch = useAppDispatch();
  const [popoverVisible, setPopoverVisible] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const notifications = useAppSelector((state) => state.notification.notifications);
  const rawUnreadCount = useAppSelector((state) => state.notification.unreadCount);

  // Always refresh notifications on mount or when user changes
  useEffect(() => {
    if (!currentUser) return;
    notificationService.getNotifications(1, 20)
      .then(({ notifications: items }) => {
        if (Array.isArray(items)) {
          dispatch(setNotifications(items));
        }
      })
      .catch(() => {});
  }, [currentUser?.id, dispatch]);

  const systemUnread = notifications.filter(
    (n) => !n.isRead && n.type !== 'chat_message' && n.type !== 'message' && n.type !== 'new_message'
  ).length;
  const unreadCount = Math.max(0, notifications.length > 0 ? systemUnread : rawUnreadCount);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Ring animation when there are unread notifications
  useEffect(() => {
    if (unreadCount <= 0) return;

    const ring = () => {
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(rotateAnim, { toValue: -1, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(rotateAnim, { toValue: 0.6, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(rotateAnim, { toValue: -0.6, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    };

    ring();
    const interval = setInterval(ring, 4500);
    return () => clearInterval(interval);
  }, [unreadCount, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '18deg'],
  });

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setPopoverVisible(true);
    }
  };

  const badgeText = unreadCount > 99 ? '99+' : `${unreadCount}`;

  return (
    <>
      <ScalePressable
        scaleTo={0.92}
        onPress={handlePress}
        style={styles.container}
      >
        <View style={styles.iconCircle}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Bell size={size} color={unreadCount > 0 ? COLORS.primary : color} />
          </Animated.View>

          {unreadCount > 0 && (
            <PulseBadge scaleMin={0.95} scaleMax={1.18} duration={1400} style={styles.badgeWrapper}>
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {badgeText}
                </Text>
              </View>
            </PulseBadge>
          )}
        </View>
      </ScalePressable>

      <NotificationPopover
        visible={popoverVisible}
        onClose={() => setPopoverVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    ...SHADOWS.soft,
  },
  badgeWrapper: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    ...SHADOWS.btn,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});

export default NotificationBell;
