// src/features/chat/components/ChatTabBadgeIcon.tsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Platform, 
  TouchableOpacity 
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useAppSelector } from '../../../app/store/hooks';
import { Avatar } from '../../../components/common/Avatar';
import { COLORS, SHADOWS, RADIUS } from '../../../theme';

interface ChatTabBadgeIconProps {
  color: string;
  size?: number;
  focused?: boolean;
  onPressTooltip?: () => void;
}

export const ChatTabBadgeIcon: React.FC<ChatTabBadgeIconProps> = ({ 
  color, 
  size = 22, 
  focused = false,
  onPressTooltip 
}) => {
  const chats = useAppSelector((state) => state.chat.chats);
  const latestSender = useAppSelector((state) => state.chat.latestUnreadSender);
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Animations
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateY = useRef(new Animated.Value(8)).current;

  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const hideTimerRef = useRef<any>(null);
  const prevLatestTimestampRef = useRef<string | null>(null);

  // Trigger wobble animation on new message or unread
  const triggerWobble = () => {
    Animated.sequence([
      Animated.timing(wobbleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wobbleAnim, {
        toValue: -1,
        duration: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wobbleAnim, {
        toValue: 0.6,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wobbleAnim, {
        toValue: -0.4,
        duration: 70,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wobbleAnim, {
        toValue: 0,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  // Continuous breathing pulse when there are unread messages
  useEffect(() => {
    if (totalUnread > 0) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [totalUnread]);

  // Show floating tooltip preview when a new incoming message arrives
  useEffect(() => {
    if (latestSender && latestSender.timestamp !== prevLatestTimestampRef.current && totalUnread > 0) {
      prevLatestTimestampRef.current = latestSender.timestamp;
      triggerWobble();

      setShowTooltip(true);
      Animated.parallel([
        Animated.spring(tooltipTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // Auto-hide tooltip after 6.5s
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(tooltipTranslateY, {
            toValue: 6,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(tooltipOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          setShowTooltip(false);
        });
      }, 6500);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [latestSender, totalUnread]);

  // Rotation style for wobble
  const rotateZ = wobbleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  });

  return (
    <View style={styles.container}>
      {/* Floating Micro-Tooltip above the tab icon to notify WHO sent the message */}
      {showTooltip && latestSender && (
        <Animated.View 
          style={[
            styles.tooltipAnchor,
            {
              opacity: tooltipOpacity,
              transform: [{ translateY: tooltipTranslateY }],
            }
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity 
            style={styles.tooltipPill}
            activeOpacity={0.9}
            onPress={onPressTooltip}
          >
            <Avatar 
              uri={latestSender.senderAvatar} 
              name={latestSender.senderName} 
              size={24} 
              showBorder 
              borderColor="#FFFFFF" 
            />
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipSender} numberOfLines={1}>
                {latestSender.senderName}
              </Text>
              <Text style={styles.tooltipMessage} numberOfLines={1}>
                {latestSender.content || 'Đã gửi tin nhắn'}
              </Text>
            </View>
          </TouchableOpacity>
          {/* Arrow pointing down to the tab icon */}
          <View style={styles.tooltipArrow} />
        </Animated.View>
      )}

      {/* Main Tab Icon with wobble animation */}
      <Animated.View 
        style={[
          styles.iconWrapper, 
          { 
            transform: [
              { rotate: rotateZ },
              { scale: focused ? 1.05 : 1 }
            ] 
          }
        ]}
      >
        <MessageCircle size={size} color={color} strokeWidth={2.2} />

        {/* Unread Badge with Sender Avatar Teaser */}
        {totalUnread > 0 && (
          <Animated.View 
            style={[
              styles.badgeContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {/* Mini avatar of sender if available */}
            {latestSender?.senderAvatar ? (
              <View style={styles.avatarMiniWrap}>
                <Avatar 
                  uri={latestSender.senderAvatar} 
                  name={latestSender.senderName} 
                  size={15} 
                  showBorder 
                  borderColor="#FFFFFF" 
                />
              </View>
            ) : null}

            {/* Unread Count Badge */}
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 38,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4D4F',
    borderRadius: RADIUS.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.soft,
    zIndex: 10,
  },
  avatarMiniWrap: {
    marginRight: 2,
    marginLeft: -2,
  },
  badgePill: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  // Floating Tooltip styling
  tooltipAnchor: {
    position: 'absolute',
    bottom: 34,
    alignItems: 'center',
    zIndex: 999,
    width: 170,
    left: -66, // Centers the 170px width over the 38px icon
  },
  tooltipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B', // Rich dark glassmorphic slate
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    gap: 6,
    maxWidth: 168,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tooltipContent: {
    flex: 1,
  },
  tooltipSender: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
  },
  tooltipMessage: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '500',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E293B',
    alignSelf: 'center',
    marginTop: -0.5,
  },
});

export default ChatTabBadgeIcon;
