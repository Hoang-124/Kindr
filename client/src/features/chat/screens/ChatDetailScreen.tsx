import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { addMessage, markAsRead, upsertChatSession, setChatMessages } from '../store/chatSlice';
import * as chatService from '../../../services/chatService';
import { socketService } from '../../../services/socketService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import { 
  SendHorizontal, 
  ShieldCheck, 
  MessageCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Check,
  CheckCheck
} from 'lucide-react-native';
import { ScalePressable } from '../../../components/common/ScalePressable';
import { Avatar } from '../../../components/common/Avatar';
import { Message } from '../../../types/common';

type ChatDetailRouteProp = RouteProp<AppStackParamList, 'ChatDetail'>;
type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const ChatDetailScreen = () => {
  const route = useRoute<ChatDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { chatId } = route.params;

  // Redux store state
  const chats = useAppSelector((state) => state.chat.chats);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Find existing session in memory
  const chat = chats.find(c => c.id === chatId || c.productId === chatId);

  const [loading, setLoading] = useState<boolean>(!chat);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 120);
  }, []);

  // Fetch or refresh chat metadata and message history
  useEffect(() => {
    let isMounted = true;

    const loadChatData = async () => {
      if (!chat) {
        setLoading(true);
      }
      setError(null);

      try {
        // 1. Fetch chat metadata
        const freshChat = await chatService.getChatById(chatId);
        if (isMounted && freshChat) {
          dispatch(upsertChatSession(freshChat));
        }

        // 2. Fetch latest messages history
        const { messages } = await chatService.getMessages(chatId);
        if (isMounted && messages) {
          dispatch(setChatMessages({ chatId: freshChat?.id || chatId, messages }));
        }
      } catch (err: any) {
        console.warn('[ChatDetail] Failed to load chat:', err);
        if (isMounted && !chat) {
          setError('Không tìm thấy cuộc trò chuyện này hoặc hội thoại đã được lưu trữ.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          scrollToBottom(false);
        }
      }
    };

    loadChatData();
    dispatch(markAsRead(chatId));

    // Join Socket room
    socketService.emit('join_chat', { chatId });
    if (chat?.id && chat.id !== chatId) {
      socketService.emit('join_chat', { chatId: chat.id });
    }

    // Listen to real-time incoming messages
    const handleIncomingMessage = (payload: any) => {
      const msg = payload.message || payload;
      const targetChatId = payload.chatId || msg.chatId;

      if (targetChatId === chatId || (chat && targetChatId === chat.id)) {
        const rawSenderId = msg.senderId?._id?.toString() || msg.senderId?.toString() || msg.senderId;
        const newMsg: Message = {
          id: msg.id || msg._id || ('m_' + Date.now() + Math.random()),
          senderId: rawSenderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
        };

        dispatch(addMessage({
          chatId: chat?.id || chatId,
          message: newMsg,
          tempId: msg.tempId || payload.tempId,
        }));
        scrollToBottom(true);
      }
    };

    // Listen to typing indicators
    const handleUserTyping = (data: any) => {
      if ((data.chatId === chatId || (chat && data.chatId === chat.id)) && data.userId !== currentUser?.id) {
        setIsPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3000);
      }
    };

    const handleUserStopTyping = (data: any) => {
      if ((data.chatId === chatId || (chat && data.chatId === chat.id)) && data.userId !== currentUser?.id) {
        setIsPartnerTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    socketService.on('message_received', handleIncomingMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('user_stop_typing', handleUserStopTyping);

    return () => {
      isMounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketService.emit('leave_chat', { chatId });
      if (chat?.id && chat.id !== chatId) {
        socketService.emit('leave_chat', { chatId: chat.id });
      }
      socketService.off('message_received', handleIncomingMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_stop_typing', handleUserStopTyping);
    };
  }, [chatId, dispatch, scrollToBottom]);

  // Handle typing debounce
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (chat) {
      if (text.length > 0) {
        socketService.emit('typing', { chatId: chat.id });
      } else {
        socketService.emit('stop_typing', { chatId: chat.id });
      }
    }
  };

  // Send message with instant optimistic update + Socket emission + HTTP persistence
  const handleSend = async () => {
    if (!inputText.trim() || !currentUser) return;

    const contentText = inputText.trim();
    setInputText('');
    socketService.emit('stop_typing', { chatId: chat?.id || chatId });

    const activeChatId = chat?.id || chatId;
    const tempId = 'temp_' + Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      senderId: currentUser.id,
      content: contentText,
      timestamp: new Date().toISOString(),
    };

    // 1. Optimistic dispatch
    dispatch(addMessage({ chatId: activeChatId, message: optimisticMessage, tempId }));
    scrollToBottom(true);

    // 2. Transmit message via Socket (or HTTP fallback if offline)
    if (socketService.isConnected()) {
      socketService.emit('send_message', {
        chatId: activeChatId,
        content: contentText,
        tempId,
      });
    } else {
      try {
        const savedMessage = await chatService.sendMessage(activeChatId, contentText, tempId);
        if (savedMessage) {
          dispatch(addMessage({ chatId: activeChatId, message: savedMessage, tempId }));
        }
      } catch (e) {
        console.warn('[ChatDetail] HTTP backup send error:', e);
      }
    }
  };

  // Format message time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Loading State
  if (loading && !chat) {
    return (
      <ScreenContainer scrollable={false} style={styles.loadingContainer}>
        <Header showBack onBackPress={() => navigation.goBack()} title="Cuộc trò chuyện" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>Đang kết nối với mẹ...</Text>
          <Text style={styles.loadingSub}>Vui lòng chờ trong giây lát</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error State / Not Found
  if (!chat || (error && (!chat.messages || chat.messages.length === 0))) {
    return (
      <ScreenContainer scrollable={false} style={styles.errorContainer}>
        <Header showBack onBackPress={() => navigation.goBack()} title="Hội thoại" />
        <View style={styles.centerBox}>
          <View style={styles.errorIconWrap}>
            <AlertCircle size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.errorTitle}>Chưa tìm thấy cuộc hội thoại</Text>
          <Text style={styles.errorSub}>
            Hội thoại này có thể chưa bắt đầu hoặc đã được lưu trữ. Mẹ có thể quay lại hoặc mở chat từ trang chi tiết đồ dùng.
          </Text>
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <ArrowLeft size={18} color={COLORS.onPrimary} />
            <Text style={styles.retryBtnText}>Quay lại hộp thư</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Determine roles & partner avatar
  const isSellerOfChat = chat.sellerId === currentUser?.id;
  const otherPartyName = isSellerOfChat ? (chat.buyerName || 'Mẹ bỉm') : (chat.sellerName || 'Mẹ bỉm');
  const otherPartyAvatar = isSellerOfChat ? chat.buyerAvatar : chat.sellerAvatar;
  // Deduplicate messages for pristine rendering (prevents duplicate bubbles on echo)
  const uniqueMessages = useMemo(() => {
    const raw = chat.messages || [];
    const seenIds = new Set<string>();
    const seenContentTime = new Map<string, number>();
    const result: Message[] = [];

    for (const m of raw) {
      if (!m || !m.content) continue;
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);

      const contentKey = `${m.senderId}_${m.content.trim()}`;
      const msgTime = new Date(m.timestamp).getTime();
      const prevTime = seenContentTime.get(contentKey);
      if (prevTime !== undefined && Math.abs(msgTime - prevTime) < 5000) {
        continue;
      }
      seenContentTime.set(contentKey, msgTime);
      result.push(m);
    }
    return result;
  }, [chat.messages]);

  const roleLabel = isSellerOfChat ? 'Mẹ cho đồ' : 'Mẹ muốn đổi';

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer scrollable={false} style={styles.screenBg}>
        {/* Top Header with partner real avatar, name & status */}
        <Header 
          titleElement={
            <View style={styles.headerPartnerWrap}>
              <View style={styles.headerAvatarContainer}>
                <Avatar 
                  uri={otherPartyAvatar} 
                  name={otherPartyName} 
                  size={36} 
                />
                <View style={styles.headerOnlineDot} />
              </View>
              <View style={styles.headerNameColumn}>
                <Text style={styles.headerTitleName} numberOfLines={1}>{otherPartyName}</Text>
                <Text style={styles.headerOnlineText}>Đang hoạt động</Text>
              </View>
            </View>
          }
          showBack 
          showNotificationBell={false}
          onBackPress={() => navigation.goBack()} 
          rightElement={
            <View style={styles.headerRolePill}>
              <Text style={styles.headerRoleText}>{roleLabel}</Text>
            </View>
          }
        />

        {/* Product Context Ribbon */}
        {chat.productId ? (
          <TouchableOpacity 
            style={styles.productRibbon}
            onPress={() => navigation.navigate('ProductDetail', { id: chat.productId })}
            activeOpacity={0.85}
          >
            {chat.productImage ? (
              <Image source={{ uri: chat.productImage }} style={styles.ribbonImg} />
            ) : (
              <View style={[styles.ribbonImg, styles.imgPlaceholder]}>
                <MessageCircle size={18} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.ribbonDetails}>
              <Text style={styles.ribbonText} numberOfLines={1}>
                {chat.productName || 'Món đồ trao đổi'}
              </Text>
              <Text style={styles.ribbonSub}>Nhấn để xem chi tiết & cam kết chất lượng</Text>
            </View>
            <View style={styles.ribbonAction}>
              <Text style={styles.ribbonActionText}>Xem đồ</Text>
              <ChevronRight size={14} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Trust & Safe Escrow Notice Banner */}
        <View style={styles.escrowNoticeRow}>
          <ShieldCheck size={14} color={COLORS.secondary} />
          <Text style={styles.escrowNoticeText}>
            Trao đổi an toàn qua Kindr Escrow. Kiểm tra đồ trực tiếp trước khi nhận.
          </Text>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={uniqueMessages}
          keyExtractor={(item, index) => item.id || `msg_${index}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom(true)}
          onLayout={() => scrollToBottom(false)}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <View style={styles.emptyFeedIcon}>
                <Sparkles size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyFeedTitle}>Bắt đầu cuộc trò chuyện!</Text>
              <Text style={styles.emptyFeedSub}>
                Hai mẹ hãy gửi lời chào và hẹn địa điểm tiện nhất để cùng trao đổi đồ cho bé nhé.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.senderId === 'system') {
              return (
                <View style={styles.systemMessageContainer}>
                  <ShieldCheck size={12} color={COLORS.secondary} style={{ marginRight: 4 }} />
                  <Text style={styles.systemMessageText}>{item.content}</Text>
                </View>
              );
            }

            const isMe = item.senderId === currentUser?.id;
            const messageTime = formatTime(item.timestamp);
            const msgAvatar = item.senderAvatar || (!isMe ? otherPartyAvatar : currentUser?.avatar);

            return (
              <View style={[
                styles.messageRow,
                isMe ? styles.myMessageRow : styles.otherMessageRow
              ]}>
                {!isMe && (
                  <View style={styles.msgAvatarWrapper}>
                    <Avatar
                      uri={msgAvatar}
                      name={otherPartyName}
                      size={32}
                    />
                  </View>
                )}
                
                <View style={[
                  styles.bubble,
                  isMe ? styles.myBubble : styles.otherBubble
                ]}>
                  <Text style={[
                    styles.messageText,
                    isMe ? styles.myMessageText : styles.otherMessageText
                  ]}>
                    {item.content}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={[
                      styles.timestampText,
                      isMe ? styles.myTimestampText : styles.otherTimestampText
                    ]}>
                      {messageTime}
                    </Text>
                    {isMe && (
                      <CheckCheck size={12} color="rgba(255, 255, 255, 0.75)" style={styles.checkIcon} />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Partner Typing Indicator */}
        {isPartnerTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.typingText}>{otherPartyName} đang soạn tin...</Text>
            </View>
          </View>
        )}

        {/* Quick Suggestion Chips for Moms */}
        <View style={styles.quickChipsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.quickChipsContent}
          >
            {[
              '👋 Chào mẹ, món này còn không ạ?',
              '📍 Mẹ ở khu vực nào để tiện hẹn gặp?',
              '🧸 Đồ dùng còn mới khoảng bao nhiêu % mom?',
              '🛵 Mẹ có hỗ trợ gửi ship qua app không ạ?',
              '🤝 Hẹn mẹ cuối tuần này trao đổi nhé!'
            ].map((chip, idx) => (
              <ScalePressable
                key={idx}
                style={styles.chipBtn}
                scaleTo={0.94}
                onPress={() => setInputText(chip)}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </ScalePressable>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Nhắn tin trao đổi với mẹ..."
            placeholderTextColor={COLORS.outline}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={1000}
          />
          <ScalePressable 
            style={[
              styles.sendBtn,
              !inputText.trim() ? styles.sendBtnDisabled : styles.sendBtnActive
            ]}
            scaleTo={0.92}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <SendHorizontal 
              size={19} 
              color={inputText.trim() ? COLORS.onPrimary : COLORS.outline} 
            />
          </ScalePressable>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenBg: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
  },
  loadingTitle: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.text,
    marginTop: SPACING.md,
    fontWeight: '700',
  },
  loadingSub: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.titleMd,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  errorSub: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    ...SHADOWS.soft,
  },
  retryBtnText: {
    ...TYPOGRAPHY.bodyMd,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  headerPartnerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 240,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerNameColumn: {
    justifyContent: 'center',
  },
  headerTitleName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerOnlineText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  msgAvatarWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  headerRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  productRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
    gap: SPACING.sm,
    ...SHADOWS.soft,
  },
  ribbonImg: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
  imgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonDetails: {
    flex: 1,
  },
  ribbonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  ribbonSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ribbonAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
  },
  ribbonActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  escrowNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    gap: 6,
  },
  escrowNoticeText: {
    fontSize: 11,
    color: COLORS.onSecondaryContainer,
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: SPACING.lg,
  },
  emptyFeedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyFeedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyFeedSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginVertical: SPACING.sm,
    maxWidth: '90%',
  },
  systemMessageText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm + 4,
    maxWidth: '82%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  avatarChar: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSecondaryContainer,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
    ...SHADOWS.soft,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.onPrimary,
  },
  otherMessageText: {
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '500',
  },
  myTimestampText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  otherTimestampText: {
    color: COLORS.textMuted,
  },
  checkIcon: {
    marginLeft: 1,
  },
  typingContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 6,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  typingText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  quickChipsContainer: {
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
  },
  quickChipsContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  chipBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#FFA8A8',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.onPrimaryContainer,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.sm,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    maxHeight: 100,
    color: COLORS.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surfaceContainer,
  },
});

export default ChatDetailScreen;
