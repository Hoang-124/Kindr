import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { hydrateChats } from '../store/chatSlice';
import * as chatService from '../../../services/chatService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import EmptyState from '../../../components/common/EmptyState';
import { timeAgo } from '../../../utils/formatDate';
import { MessageSquare } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const ChatListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const chats = useAppSelector((state) => state.chat.chats);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  useEffect(() => {
    chatService.getChats()
      .then(apiChats => {
        if (apiChats && apiChats.length > 0) {
          dispatch(hydrateChats(apiChats));
        }
      })
      .catch(() => {});
  }, [dispatch]);

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Hộp thư của mẹ" />

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState 
            title="Hộp thư trống"
            description="Mẹ chưa có cuộc trò chuyện nào. Hãy nhắn tin hỏi thăm các mẹ đăng đồ nhé!"
            icon={<MessageSquare size={48} color={COLORS.outline} />}
          />
        }
        renderItem={({ item }) => {
          const isSellerOfChat = item.sellerId === currentUser?.id;
          const otherPartyName = isSellerOfChat ? item.buyerName : item.sellerName;
          
          return (
            <TouchableOpacity
              style={styles.chatCard}
              onPress={() => navigation.navigate('ChatDetail', { chatId: item.id })}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.productImage }} style={styles.prodImg} />
              
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.otherPartyName} numberOfLines={1}>{otherPartyName}</Text>
                  <Text style={styles.timestamp}>{timeAgo(item.lastMessageTime)}</Text>
                </View>
                
                <Text style={styles.prodName} numberOfLines={1}>Đồ dùng: {item.productName}</Text>
                
                <View style={styles.chatFooter}>
                  <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessageText}</Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: 100, // Account for bottom tab height
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
    gap: SPACING.md,
  },
  prodImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otherPartyName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '500',
  },
  prodName: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    flex: 1,
    marginRight: SPACING.sm,
  },
  unreadBadge: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: COLORS.onTertiary,
    fontSize: 9,
    fontWeight: '700',
  },
});
export default ChatListScreen;
