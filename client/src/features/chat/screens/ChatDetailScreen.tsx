// src/features/chat/screens/ChatDetailScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { addMessage, markAsRead } from '../store/chatSlice';
import * as chatService from '../../../services/chatService';
import { socketService } from '../../../services/socketService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import { Send, SendHorizontal } from 'lucide-react-native';

type ChatDetailRouteProp = RouteProp<AppStackParamList, 'ChatDetail'>;

export const ChatDetailScreen = () => {
  const route = useRoute<ChatDetailRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { chatId } = route.params;

  // Select data from Redux
  const chats = useAppSelector((state) => state.chat.chats);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const chat = chats.find(c => c.id === chatId);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Mark messages as read on entry
    dispatch(markAsRead(chatId));

    // Listen to real-time incoming socket message
    socketService.emit('join_chat', { chatId });
    const handleIncomingMessage = (msg: any) => {
      if (msg.chatId === chatId) {
        dispatch(addMessage({
          chatId,
          message: {
            id: msg.id || msg._id || 'm_' + Date.now(),
            senderId: msg.senderId?._id || msg.senderId,
            content: msg.content,
            timestamp: msg.createdAt || new Date().toISOString(),
          }
        }));
        scrollToBottom();
      }
    };

    socketService.on('message_received', handleIncomingMessage);
    return () => {
      socketService.off('message_received', handleIncomingMessage);
    };
  }, [chatId]);

  if (!chat) {
    return (
      <ScreenContainer loading={false} style={styles.errorContainer}>
        <Header showBack />
        <Text style={styles.errorText}>Không tìm thấy cuộc hội thoại.</Text>
      </ScreenContainer>
    );
  }

  const isSellerOfChat = chat.sellerId === currentUser?.id;
  const otherPartyName = isSellerOfChat ? chat.buyerName : chat.sellerName;
  const otherPartyId = isSellerOfChat ? chat.buyerId : chat.sellerId;

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = () => {
    if (!inputText.trim() || !currentUser) return;

    const contentText = inputText.trim();
    const userMessage = {
      id: 'm_' + Math.random().toString(),
      senderId: currentUser.id,
      content: contentText,
      timestamp: new Date().toISOString(),
    };

    // Emit via socket if connected
    socketService.emit('send_message', {
      chatId,
      content: contentText,
    });

    // 1. Dispatch user message to local Redux
    dispatch(addMessage({ chatId, message: userMessage }));
    const typedText = contentText.toLowerCase();
    setInputText('');
    scrollToBottom();

    // 2. Trigger Smart AI chatbot simulation of the other mother
    setTimeout(() => {
      let botReplyText = '';

      if (typedText.includes('mới') || typedText.includes('cũ') || typedText.includes('tình trạng')) {
        botReplyText = `Dạ đồ vẫn còn rất mới và sạch sẽ nha mẹ ơi! Bé nhà mình chơi rất giữ gìn nên gỗ còn nhẵn nhụi, không bị trầy xước hay tróc sơn gì đâu ạ. Mẹ yên tâm nha.`;
      } else if (typedText.includes('địa chỉ') || typedText.includes('ở đâu') || typedText.includes('quận') || typedText.includes('phường')) {
        botReplyText = `Dạ mình đang ở khu vực ${isSellerOfChat ? chat.buyerName : 'Đà Nẵng'} nha mẹ. Mẹ rảnh lúc nào tiện ghé qua giao lưu trực tiếp rồi quét mã QR luôn cho tiện, đỡ mất phí ship bưu điện nè!`;
      } else if (typedText.includes('giảm') || typedText.includes('bớt') || typedText.includes('xu')) {
        botReplyText = `Hệ thống gợi ý giá này là chuẩn rồi mẹ ạ. 1 Xu chỉ tương đương 10.000 VNĐ thui nè. Mình đóng góp đồ tốt nên mới được Xu, mẹ thông cảm nha hihi.`;
      } else if (typedText.includes('lấy') || typedText.includes('đổi') || typedText.includes('nhận') || typedText.includes('giao dịch')) {
        botReplyText = `Dạ ok mẹ nè! Mẹ cứ nhấn nút "Yêu cầu nhận đồ" ở trang chi tiết sản phẩm nha. Két Xu của Trạm tạm khóa sẽ đóng băng Xu bảo chứng uy tín cho cả hai mẹ, rất an toàn nha!`;
      } else {
        botReplyText = `Dạ chào mẹ nhé! Rất vui được trao đổi đồ dùng cùng mẹ. Bé nhà mình lớn rồi nên muốn chia sẻ món đồ chơi này cho các bé khác. Mẹ có câu hỏi gì thêm cứ nhắn mình nha.`;
      }

      const botMessage = {
        id: 'm_bot_' + Math.random().toString(),
        senderId: otherPartyId,
        content: botReplyText,
        timestamp: new Date().toISOString(),
      };

      dispatch(addMessage({ chatId, message: botMessage }));
      scrollToBottom();
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScreenContainer scrollable={false}>
        {/* Dynamic header pointing to product details */}
        <Header 
          title={otherPartyName} 
          showBack 
          onBackPress={() => navigation.goBack()} 
        />

        {/* Small product ribbon */}
        <TouchableOpacity 
          style={styles.productRibbon}
          onPress={() => navigation.navigate('ProductDetail', { id: chat.productId })}
          activeOpacity={0.8}
        >
          <Image source={{ uri: chat.productImage }} style={styles.ribbonImg} />
          <View style={styles.ribbonDetails}>
            <Text style={styles.ribbonText} numberOfLines={1}>Đang chat về: {chat.productName}</Text>
            <Text style={styles.ribbonSub}>Nhấp để xem chi tiết đồ dùng</Text>
          </View>
        </TouchableOpacity>

        {/* Messages Feed */}
        <FlatList
          ref={flatListRef}
          data={chat.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          renderItem={({ item }) => {
            if (item.senderId === 'system') {
              return (
                <View style={styles.systemMessageContainer}>
                  <Text style={styles.systemMessageText}>{item.content}</Text>
                </View>
              );
            }

            const isMe = item.senderId === currentUser?.id;
            return (
              <View style={[
                styles.messageRow,
                isMe ? styles.myMessageRow : styles.otherMessageRow
              ]}>
                {!isMe && (
                  <View style={styles.botAvatarCircle}>
                    <Text style={styles.botAvatarChar}>{otherPartyName.charAt(0)}</Text>
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
                </View>
              </View>
            );
          }}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Nhắn tin trò chuyện với mẹ bỉm..."
            placeholderTextColor={COLORS.outline}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendBtn,
              !inputText.trim() ? styles.sendBtnDisabled : null
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <SendHorizontal size={20} color={inputText.trim() ? COLORS.onPrimary : COLORS.outline} />
          </TouchableOpacity>
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.error,
    marginTop: SPACING.xl,
  },
  productRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
    gap: SPACING.sm,
  },
  ribbonImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
  },
  ribbonDetails: {
    flex: 1,
  },
  ribbonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  ribbonSub: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: 20,
  },
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: SPACING.sm,
    maxWidth: '85%',
  },
  systemMessageText: {
    fontSize: 11,
    color: COLORS.onSecondaryContainer,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    maxWidth: '75%',
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
  botAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarChar: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
    ...SHADOWS.soft,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomLeftRadius: 2,
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
    color: COLORS.onSurface,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.sm,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    maxHeight: 100,
    color: COLORS.onSurface,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surfaceContainer,
    elevation: 0,
  },
});
export default ChatDetailScreen;
