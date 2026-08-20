// src/features/home/screens/ProductDetailScreen.tsx
import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Alert
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { updateProductStatus } from '../store/homeSlice';
import { createTransaction, initiateExchangeAsync } from '../../exchange/store/exchangeSlice';
import { updateUserBalance, refreshWalletBalance } from '../../auth/store/authSlice';
import { createChatSession } from '../../chat/store/chatSlice';
import * as chatService from '../../../services/chatService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import ModalConfirm from '../../../components/common/ModalConfirm';
import Button from '../../../components/common/Button';
import MascotIcon from '../../../components/common/MascotIcon';
import { DEFAULT_IMAGES } from '../../../utils/constants';
import { formatXuToVND, maskPhoneNumber } from '../../../utils/helpers';
import { calculateSafeFee } from '../../../utils/pricing';
import { 
  Heart, 
  Clock, 
  MapPin, 
  Smile, 
  MessageSquare, 
  Star, 
  BadgeCheck, 
  ShieldAlert, 
  ChevronRight,
  ShieldCheck,
  Phone,
  Sparkles
} from 'lucide-react-native';
import { ScalePressable } from '../../../components/common/ScalePressable';
import { PulseBadge } from '../../../components/common/PulseBadge';

type ProductDetailRouteProp = RouteProp<AppStackParamList, 'ProductDetail'>;
type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const { id } = route.params;

  // Select data from Redux
  const products = useAppSelector((state) => state.home.products);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const product = products.find(p => p.id === id);

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!product) {
    return (
      <ScreenContainer loading={false} style={styles.errorContainer}>
        <Header showBack />
        <Text style={styles.errorText}>Không tìm thấy sản phẩm mẹ yêu cầu.</Text>
      </ScreenContainer>
    );
  }

  // Calculate pricing for double escrow
  const isCharity = product.category === 'charity' || product.category === 'tu_thien' || product.price === 0;
  const buyerPrice = product.price; // Xu required by buyer
  const sellerSafeFee = isCharity ? 0 : (product.safeFeeLocked || calculateSafeFee(product.price));

  const handleRequestItem = () => {
    // Open Double Escrow commitment dialog
    setModalVisible(true);
  };

  const handleConfirmEscrow = async () => {
    if (!currentUser) return;

    if (currentUser.xuBalance < buyerPrice) {
      setModalVisible(false);
      Alert.alert(
        'Số Xu không đủ',
        `Mẹ cần tối thiểu ${buyerPrice} Xu để thực hiện đổi món đồ này.\n\nSố dư ví hiện tại: ${currentUser.xuBalance} Xu.\nMẹ hãy đăng món đồ cũ của bé lên sàn để tích thêm Xu nhé! ❤️`,
        [{ text: 'Đồng ý' }]
      );
      return;
    }

    setLoading(true);

    try {
      const resultTx = await dispatch(initiateExchangeAsync(product.id)).unwrap();
      dispatch(refreshWalletBalance());
      dispatch(updateProductStatus({ id: product.id, status: 'escrow' }));
      setLoading(false);
      setModalVisible(false);
      navigation.navigate('TransactionDetail', { id: resultTx.id });
    } catch (err: any) {
      const transactionId = 'tx_' + Math.random().toString(36).substring(2, 9);
      
      dispatch(createTransaction({
        id: transactionId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        buyerId: currentUser.id,
        buyerName: currentUser.name,
        buyerPhone: currentUser.phone,
        buyerZalo: currentUser.phone,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        sellerPhone: product.sellerPhone || '0905123456',
        sellerZalo: product.sellerZalo || '0905123456',
        buyerEscrowFrozen: buyerPrice,
        sellerEscrowFrozen: sellerSafeFee,
        status: 'awaiting_handover',
        createdAt: new Date().toISOString(),
      }));

      if (buyerPrice > 0) {
        dispatch(updateUserBalance({
          userId: currentUser.id,
          amount: -buyerPrice,
        }));
      }

      dispatch(updateProductStatus({
        id: product.id,
        status: 'escrow',
      }));

      setLoading(false);
      setModalVisible(false);
      navigation.navigate('TransactionDetail', { id: transactionId });
    }
  };

  const handleOpenChat = async () => {
    if (!currentUser) return;

    try {
      const { chat } = await chatService.createChat(product.id, product.sellerId);
      navigation.navigate('ChatDetail', { chatId: chat.id });
    } catch (e) {
      const chatId = `chat_${currentUser.id}_${product.sellerId}_${product.id}`;
      dispatch(createChatSession({
        id: chatId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        buyerId: currentUser.id,
        buyerName: currentUser.name,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        messages: [
          {
            id: 'msg_welcome_' + Date.now(),
            senderId: 'system',
            content: `Chào hai mẹ! Khung chat được mở để hai mẹ hẹn gặp trao đổi món đồ "${product.name}".`,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }
        ],
        unreadCount: 0,
        lastMessageText: 'Khung chat trao đổi đã sẵn sàng',
        lastMessageTime: 'Vừa xong',
      }));
      navigation.navigate('ChatDetail', { chatId });
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <View style={styles.absoluteHeader}>
        <TouchableOpacity 
          style={styles.headerCircleBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={[styles.headerCircleIcon, styles.rotatedBack]}>➔</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerCircleBtn}
          onPress={() => setIsFavorite(!isFavorite)}
          activeOpacity={0.8}
        >
          <Heart size={20} color={isFavorite ? '#FF4757' : '#ffffff'} fill={isFavorite ? '#FF4757' : 'transparent'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Hero Image */}
        <Image source={{ uri: product.image }} style={styles.heroImage} resizeMode="cover" />

        {/* Product Details Sheet */}
        <View style={styles.detailsCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <View style={styles.timeLocationRow}>
                <Clock size={13} color={COLORS.outline} />
                <Text style={styles.timeAgoText}>{product.timeAgo || 'Vừa đăng'}</Text>
              </View>
            </View>

            {/* Price Badge */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceSymbol}>🪙</Text>
              <Text style={styles.priceText}>{product.price} Xu</Text>
              <Text style={styles.priceSubVnd}>~ {formatXuToVND(product.price)}</Text>
            </View>
          </View>

          {/* Categories/Attribute tags */}
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: '#E2F0CB' }]}>
              <Text style={[styles.tagText, { color: '#4B5C35' }]}>✨ {product.conditionLabel}</Text>
            </View>
            {product.ageRange && (
              <View style={[styles.tag, { backgroundColor: '#DFE7FD' }]}>
                <Smile size={14} color="#24345F" />
                <Text style={[styles.tagText, { color: '#24345F' }]}>Độ tuổi: {product.ageRange}</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: '#FDE2E4' }]}>
              <MapPin size={14} color="#5E3032" />
              <Text style={[styles.tagText, { color: '#5E3032' }]}>{product.locationName}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả từ mẹ bán</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Seller profile card */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerLeft}>
              <Image source={{ uri: product.sellerAvatar }} style={styles.sellerAvatar} />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>
                  {product.sellerName}
                  <BadgeCheck size={16} color={COLORS.primary} style={styles.verificationCheck} />
                </Text>
                <View style={styles.ratingRow}>
                  <Star size={13} color="#F5A623" fill="#F5A623" />
                  <Text style={styles.ratingText}>4.9 (Mẹ Bỉm Văn Minh 98 điểm)</Text>
                </View>
                <Text style={styles.sellerMaskedPhone}>
                  📞 SĐT: {maskPhoneNumber(product.sellerPhone)} (Mở khóa khi đổi)
                </Text>
              </View>
            </View>
          </View>

          {/* Double Escrow Trust Banner with Breathing Aura */}
          <PulseBadge scaleMin={0.98} scaleMax={1.03} duration={2500}>
            <View style={styles.safetyBox}>
              <ShieldCheck size={28} color={COLORS.primary} />
              <View style={styles.safetyTextWrapper}>
                <Text style={styles.safetyTitle}>Bảo chứng Ký Quỹ Kép (Double Escrow) 🛡️</Text>
                <Text style={styles.safetyText}>
                  Người bán đã ký quỹ {sellerSafeFee} Xu Safe Fee (10%) cam kết chất lượng. Mẹ có 6 giờ kiểm định tại nhà sau khi nhận đồ trước khi Xu được giải ngân.
                </Text>
              </View>
            </View>
          </PulseBadge>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Buttons */}
      <View style={styles.bottomBar}>
        <Button
          title={isCharity ? "Nhận Quà 0 Xu ❤️" : `Đổi Đồ Ngay (${product.price} Xu)`}
          onPress={handleRequestItem}
          style={styles.requestBtn}
        />
        <ScalePressable 
          style={styles.chatBtn}
          scaleTo={0.92}
          onPress={handleOpenChat}
        >
          <MessageSquare size={20} color={COLORS.primary} />
          <Text style={styles.chatBtnText}>Nhắn tin</Text>
        </ScalePressable>
      </View>

      {/* Double Escrow Confirmation Modal */}
      <ModalConfirm
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmEscrow}
        loading={loading}
        title="🔒 Xác Nhận Ký Quỹ Đổi Đồ"
        confirmTitle="Đồng Ý Khóa Xu"
        description={isCharity 
          ? `Món đồ này thuộc Trạm Tặng Đồ (0 Xu). Mẹ không mất Xu nào để nhận đồ cho bé!`
          : `Hệ thống sẽ tạm đóng băng bảo chứng:\n\n• ${buyerPrice} Xu (~${formatXuToVND(buyerPrice)}) của mẹ.\n• Người bán đã tạm khóa sẵn ${sellerSafeFee} Xu Safe Fee (10%).\n\nSau khi nhận đồ, mẹ có 6 Giờ Kiểm Định Tại Nhà. Hết 6 giờ không khiếu nại, Xu mới chính thức được giải phóng!`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  absoluteHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    zIndex: 20,
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 26, 17, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCircleIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rotatedBack: {
    transform: [{ rotate: '180deg' }],
  },
  scrollContent: {
    paddingBottom: 160,
  },
  heroImage: {
    width: '100%',
    height: 380,
    backgroundColor: COLORS.surfaceContainer,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.containerPadding,
    minHeight: 500,
    ...SHADOWS.card,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  productTitle: {
    ...TYPOGRAPHY.titleLg,
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  timeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeAgoText: {
    fontSize: 12,
    color: COLORS.outline,
  },
  priceBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.2)',
  },
  priceSymbol: {
    fontSize: 16,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
  },
  priceSubVnd: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleSm,
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainer,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationCheck: {
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  sellerMaskedPhone: {
    fontSize: 11,
    color: COLORS.outline,
    marginTop: 3,
  },
  safetyBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryContainer,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  safetyTextWrapper: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 12,
    color: COLORS.onPrimaryContainer,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    gap: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  requestBtn: {
    flex: 2,
  },
  chatBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
});

export default ProductDetailScreen;
