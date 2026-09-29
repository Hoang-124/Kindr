// src/features/home/screens/ProductDetailScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { createChatSession, upsertChatSession } from '../../chat/store/chatSlice';
import * as chatService from '../../../services/chatService';
import * as productService from '../../../services/productService';
import { addNotification } from '../../notification/store/notificationSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import ModalConfirm from '../../../components/common/ModalConfirm';
import Button from '../../../components/common/Button';
import MascotIcon from '../../../components/common/MascotIcon';
import KindrCoin from '../../../components/common/KindrCoin';
import { DEFAULT_IMAGES } from '../../../utils/constants';
import { formatXuToVND, maskPhoneNumber } from '../../../utils/helpers';
import { calculateSafeFee, getCategoryLabel } from '../../../utils/pricing';
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
  Sparkles,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Lock,
  Image as ImageIcon
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
  const transactions = useAppSelector((state) => state.exchange.transactions);

  const reduxProduct = products.find(p => p.id === id);
  const [remoteProduct, setRemoteProduct] = useState<any>(null);
  const [fetchingRemote, setFetchingRemote] = useState(!reduxProduct);

  const product = remoteProduct || reduxProduct;
  const relatedTx = transactions.find(t => t.productId === id || t.productId === product?.id);

  useEffect(() => {
    let isMounted = true;
    productService.getProductById(id)
      .then((res: any) => {
        if (isMounted && res) {
          setRemoteProduct(res);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setFetchingRemote(false);
      });
    return () => { isMounted = false; };
  }, [id]);

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAdminApprove = async () => {
    if (!product) return;
    Alert.alert('Duyệt bài đăng', `Xác nhận duyệt món đồ "${product.name}" để hiển thị công khai trên trang chủ?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt bài',
        onPress: async () => {
          try {
            await api.put(`/admin/products/${product.id}/approve`);
            setRemoteProduct((prev: any) => prev ? { ...prev, status: 'available' } : null);
            dispatch(updateProductStatus({ id: product.id, status: 'available' }));
            Alert.alert('Thành công', 'Bài đăng đã được duyệt hiển thị trên sàn!');
          } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.error || 'Không thể duyệt tin đăng.');
          }
        }
      }
    ]);
  };

  const handleAdminReject = async () => {
    if (!product) return;
    const isPending = product.status === 'pending_approval';
    Alert.alert(
      isPending ? 'Từ chối tin đăng' : 'Gỡ tin đăng vi phạm',
      `Xác nhận gỡ bỏ bài đăng "${product.name}" khỏi hệ thống?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gỡ tin',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/products/${product.id}`);
              Alert.alert('Thành công', 'Đã gỡ bài đăng.', [
                { text: 'Đồng ý', onPress: () => navigation.goBack() }
              ]);
            } catch (e: any) {
              Alert.alert('Lỗi', e?.response?.data?.error || 'Không thể gỡ tin.');
            }
          }
        }
      ]
    );
  };

  if (fetchingRemote && !product) {
    return (
      <ScreenContainer loading={true} style={styles.errorContainer}>
        <Header showBack title="Chi Tiết Tin Đăng" />
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer loading={false} style={styles.errorContainer}>
        <Header showBack title="Chi Tiết Tin Đăng" />
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
        `Mẹ cần tối thiểu ${buyerPrice} Xu để thực hiện đổi món đồ này.\n\nSố dư ví hiện tại: ${currentUser.xuBalance} Xu.\nMẹ hãy đăng món đồ cũ của bé lên sàn để tích thêm Xu nhé!`,
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
        sellerPhone: product.sellerPhone || '',
        sellerZalo: product.sellerZalo || product.sellerPhone || '',
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

      // Notify seller
      dispatch(addNotification({
        id: 'notif_' + Date.now(),
        userId: product.sellerId,
        type: 'match_request',
        title: 'Có mẹ vừa chọn đổi đồ của bạn! 🎉',
        body: `${currentUser.name} vừa bấm đổi món: "${product.name}". Bấm vào để xem thông tin liên hệ và trao đổi nhé!`,
        isRead: false,
        relatedTransactionId: transactionId,
        relatedProductId: product.id,
        data: { transactionId, productId: product.id, buyerName: currentUser.name },
        createdAt: new Date().toISOString(),
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
      dispatch(upsertChatSession(chat));
      navigation.navigate('ChatDetail', { chatId: chat.id });
    } catch (e) {
      const chatId = `chat_${currentUser.id}_${product.sellerId}_${product.id}`;
      dispatch(upsertChatSession({
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
            timestamp: new Date().toISOString()
          }
        ],
        unreadCount: 0,
        lastMessageText: 'Khung chat trao đổi đã sẵn sàng',
        lastMessageTime: new Date().toISOString(),
      }));
      navigation.navigate('ChatDetail', { chatId });
    }
  };

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const allImages = [product.image, ...(product.additionalImages || [])].filter(Boolean);
  const activeImageUri = allImages[selectedImageIndex] || product.image || DEFAULT_IMAGES.PRODUCT_FALLBACK;

  return (
    <View style={styles.container}>
      {/* Floating Top Navigation Header */}
      <View style={styles.absoluteHeader}>
        <TouchableOpacity 
          style={styles.headerCircleBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.headerRightGroup}>
          {currentUser?.role === 'admin' && (
            <TouchableOpacity 
              style={[styles.headerCircleBtn, styles.headerTrashBtn]}
              onPress={handleAdminReject}
              activeOpacity={0.8}
            >
              <Trash2 size={18} color={COLORS.error} strokeWidth={2.2} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.headerCircleBtn}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.8}
          >
            <Heart 
              size={20} 
              color={isFavorite ? '#EF4444' : '#0F172A'} 
              fill={isFavorite ? '#EF4444' : 'transparent'} 
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: activeImageUri }} 
            style={styles.heroImage} 
            resizeMode="cover" 
          />

          {/* Multiple Images Indicator / Thumbnails */}
          {allImages.length > 1 && (
            <View style={styles.imageIndicatorBadge}>
              <ImageIcon size={12} color="#FFFFFF" />
              <Text style={styles.imageIndicatorText}>{selectedImageIndex + 1} / {allImages.length}</Text>
            </View>
          )}
        </View>

        {/* Thumbnail Selector Strip if > 1 Image */}
        {allImages.length > 1 && (
          <View style={styles.thumbnailStrip}>
            {allImages.map((imgUri, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumbBox,
                  selectedImageIndex === idx && styles.thumbBoxActive
                ]}
                onPress={() => setSelectedImageIndex(idx)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: imgUri }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Product Details Bottom Sheet */}
        <View style={styles.detailsCard}>
          {/* Subtle Top Handle */}
          <View style={styles.sheetHandle} />

          {/* Admin Moderation Alert Banner */}
          {product.status === 'pending_approval' && (
            <View style={styles.pendingAdminBanner}>
              <View style={styles.pendingBadgeIconWrap}>
                <ShieldAlert size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={styles.pendingAdminTitle}>Tin Đăng Chờ Duyệt</Text>
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>Chờ phê duyệt</Text>
                  </View>
                </View>
                <Text style={styles.pendingAdminSubtitle}>
                  {currentUser?.role === 'admin' 
                    ? 'Bạn đang xem tin với quyền Quản trị viên. Hãy kiểm tra hình ảnh, tình trạng và nội dung trước khi duyệt.'
                    : 'Tin đăng này đang được kiểm duyệt an toàn bởi Kindr Admin trước khi xuất hiện công khai.'}
                </Text>
              </View>
            </View>
          )}

          {/* Title & Price Header Row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              {/* Category Mini Pill & Time */}
              <View style={styles.catTimeRow}>
                <View style={styles.catMiniPill}>
                  <Text style={styles.catMiniPillText}>{getCategoryLabel(product.category)}</Text>
                </View>
                <Text style={styles.dotSeparator}>•</Text>
                <Clock size={12} color="#64748B" />
                <Text style={styles.timeAgoText}>{product.timeAgo || 'Vừa đăng'}</Text>
              </View>

              <Text style={styles.productTitle}>{product.name}</Text>
            </View>

            {/* Golden Sunset Price Card */}
            <View style={styles.priceCard}>
              <View style={styles.priceNumRow}>
                <KindrCoin size={18} />
                <Text style={styles.priceNumText}>{product.price}</Text>
                <Text style={styles.priceUnitText}>Xu</Text>
              </View>
              <Text style={styles.priceSubVnd}>~ {formatXuToVND(product.price)}</Text>
            </View>
          </View>

          {/* Cohesive Attribute Tag Pills */}
          <View style={styles.tagsContainer}>
            {/* Condition Tag */}
            <View style={styles.conditionTag}>
              <Sparkles size={13} color="#059669" strokeWidth={2.2} />
              <Text style={styles.conditionText}>
                Mới {product.condition}% • {product.condition === '90' ? 'Rất mới' : product.condition === '80' ? 'Dùng tốt' : 'Nguyên vẹn'}
              </Text>
            </View>

            {/* Age Range Tag */}
            {Boolean(product.ageRange) && (
              <View style={styles.ageTag}>
                <Smile size={13} color="#2563EB" strokeWidth={2.2} />
                <Text style={styles.ageText}>Bé {product.ageRange}</Text>
              </View>
            )}

            {/* Location Tag */}
            <View style={styles.locationTag}>
              <MapPin size={13} color="#E11D48" strokeWidth={2.2} />
              <Text style={styles.locationText} numberOfLines={1}>
                {product.locationName.split(',')[0]} • {product.distance || '< 2 km'}
              </Text>
            </View>
          </View>

          {/* Description Card */}
          <View style={styles.descriptionSection}>
            <View style={styles.sectionHeaderRow}>
              <MessageSquare size={15} color={COLORS.primary} strokeWidth={2.4} />
              <Text style={styles.sectionTitle}>Mô tả từ mẹ bán</Text>
            </View>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Seller Profile Card (High Trust) */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatarWrapper}>
              <Image 
                source={{ uri: product.sellerAvatar || DEFAULT_IMAGES.AVATAR_FALLBACK }} 
                style={styles.sellerAvatar} 
              />
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{product.sellerName}</Text>
                <BadgeCheck size={16} color="#0284C7" />
              </View>

              <View style={styles.sellerMetaRow}>
                <View style={styles.starRatingBadge}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.starRatingText}>4.9</Text>
                </View>

                <View style={styles.reputationPill}>
                  <Text style={styles.reputationPillText}>Mẹ Bỉm Văn Minh (98đ)</Text>
                </View>
              </View>

              <View style={styles.sellerSecurityRow}>
                <Phone size={11} color="#64748B" />
                <Text style={styles.sellerSecurityText}>
                  {currentUser?.role === 'admin' 
                    ? `SĐT: ${product.sellerPhone || 'Chưa cập nhật'} (Admin thấy)`
                    : `SĐT: ${maskPhoneNumber(product.sellerPhone)} (Mở khóa khi đổi)`}
                </Text>
              </View>
            </View>
          </View>

          {/* Double Escrow Trust Highlight Card */}
          <PulseBadge scaleMin={0.99} scaleMax={1.01} duration={2600}>
            <View style={styles.escrowCard}>
              <View style={styles.escrowHeader}>
                <View style={styles.escrowShieldCircle}>
                  <ShieldCheck size={20} color={COLORS.primary} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.escrowTitle}>Bảo chứng Ký Quỹ Kép (Double Escrow)</Text>
                  <Text style={styles.escrowSubtitle}>An tâm 100% không lo hàng bẩn hay lừa đảo</Text>
                </View>
              </View>

              <View style={styles.escrowBody}>
                <View style={styles.escrowPointRow}>
                  <View style={styles.escrowPointDot} />
                  <Text style={styles.escrowPointText}>
                    <Text style={{ fontWeight: '700', color: '#9A3412' }}>Người bán đã cọc:</Text> {sellerSafeFee} Xu Safe Fee (10%) cam kết chất lượng chuẩn mô tả.
                  </Text>
                </View>

                <View style={styles.escrowPointRow}>
                  <View style={styles.escrowPointDot} />
                  <Text style={styles.escrowPointText}>
                    <Text style={{ fontWeight: '700', color: '#9A3412' }}>6 Giờ Kiểm Định Tại Nhà:</Text> Mẹ nhận đồ mang về kiểm tra an toàn, hết 6h mới giải ngân Xu.
                  </Text>
                </View>
              </View>
            </View>
          </PulseBadge>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        {product.status === 'pending_approval' ? (
          currentUser?.role === 'admin' ? (
            <View style={styles.adminActionBar}>
              <TouchableOpacity
                style={[styles.adminActionBtn, styles.adminRejectBtn]}
                onPress={handleAdminReject}
                activeOpacity={0.8}
              >
                <X size={18} color={COLORS.error} />
                <Text style={styles.adminRejectBtnText}>Từ chối tin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminActionBtn, styles.adminApproveBtn]}
                onPress={handleAdminApprove}
                activeOpacity={0.8}
              >
                <Check size={18} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.adminApproveBtnText}>Duyệt bài đăng ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.userPendingNotice}>
              <ShieldAlert size={18} color="#D97706" />
              <Text style={styles.userPendingNoticeText}>Tin đăng đang chờ Kindr duyệt trước khi mở giao dịch.</Text>
            </View>
          )
        ) : currentUser?.id === product.sellerId ? (
          product.status === 'escrow' ? (
            <View style={styles.ownProductBottomRow}>
              <View style={[styles.ownProductNotice, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Sparkles size={16} color="#D97706" />
                <Text style={[styles.ownProductNoticeText, { color: '#B45309', fontWeight: '700' }]}>
                  Đang trong giao dịch đổi đồ
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.editMyPostBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => navigation.navigate('TransactionDetail', { id: relatedTx?.id || product.id })}
                activeOpacity={0.8}
              >
                <Text style={[styles.editMyPostBtnText, { color: '#FFFFFF' }]}>Xem giao dịch</Text>
              </TouchableOpacity>
            </View>
          ) : product.status === 'completed' ? (
            <View style={styles.ownProductBottomRow}>
              <View style={[styles.ownProductNotice, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0', flex: 1 }]}>
                <Check size={16} color="#15803D" />
                <Text style={[styles.ownProductNoticeText, { color: '#15803D', fontWeight: '700' }]}>
                  Món đồ này đã hoàn tất đổi đồ thành công
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.ownProductBottomRow}>
              <View style={styles.ownProductNotice}>
                <Sparkles size={16} color="#059669" />
                <Text style={styles.ownProductNoticeText}>Món đồ này do bạn đăng bán</Text>
              </View>
              <TouchableOpacity
                style={styles.editMyPostBtn}
                onPress={() => navigation.navigate('EditPost', { postId: product.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.editMyPostBtnText}>Chỉnh sửa tin</Text>
              </TouchableOpacity>
            </View>
          )
        ) : product.status === 'escrow' ? (
          <View style={styles.actionsRow}>
            {/* Chat button */}
            <TouchableOpacity 
              style={styles.chatBtn}
              onPress={handleOpenChat}
              activeOpacity={0.8}
            >
              <MessageSquare size={18} color="#334155" strokeWidth={2.2} />
              <Text style={styles.chatBtnText}>Nhắn tin</Text>
            </TouchableOpacity>

            {/* Locked Escrow Indicator */}
            <View
              style={[
                styles.primaryExchangeBtn,
                { backgroundColor: '#94A3B8', opacity: 0.95 }
              ]}
            >
              <Lock size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.primaryExchangeBtnText}>
                Đang trong bảo chứng (Đã có người đổi)
              </Text>
            </View>
          </View>
        ) : product.status === 'completed' ? (
          <View style={styles.actionsRow}>
            <View
              style={[
                styles.primaryExchangeBtn,
                { backgroundColor: '#10B981', flex: 1 }
              ]}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.primaryExchangeBtnText}>
                Món đồ đã được trao đổi
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            {/* Chat button */}
            <TouchableOpacity 
              style={styles.chatBtn}
              onPress={handleOpenChat}
              activeOpacity={0.8}
            >
              <MessageSquare size={18} color="#334155" strokeWidth={2.2} />
              <Text style={styles.chatBtnText}>Nhắn tin</Text>
            </TouchableOpacity>

            {/* Primary CTA: Exchange / Take Gift */}
            <TouchableOpacity
              style={[
                styles.primaryExchangeBtn,
                isCharity && styles.charityExchangeBtn
              ]}
              onPress={handleRequestItem}
              activeOpacity={0.85}
            >
              <Sparkles size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.primaryExchangeBtnText}>
                {isCharity ? "Nhận Quà 0 Xu" : `Đổi Đồ Ngay • ${product.price} Xu`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Double Escrow Confirmation Modal */}
      <ModalConfirm
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmEscrow}
        loading={loading}
        title="Xác Nhận Ký Quỹ Đổi Đồ"
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
    backgroundColor: '#F8FAFC',
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
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  headerTrashBtn: {
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
    borderColor: '#FCA5A5',
  },
  scrollContent: {
    paddingBottom: 220,
  },
  heroContainer: {
    width: '100%',
    height: 360,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicatorBadge: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  thumbnailStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 8,
    zIndex: 10,
  },
  thumbBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbBoxActive: {
    borderColor: COLORS.primary,
    borderWidth: 2.5,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingTop: 12,
    paddingHorizontal: 20,
    minHeight: 500,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  catTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  catMiniPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catMiniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#94A3B8',
  },
  timeAgoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  priceCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  priceNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceNumText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#B45309',
  },
  priceUnitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 2,
  },
  priceSubVnd: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  ageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '100%',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE123C',
  },
  descriptionSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  sellerAvatarWrapper: {
    position: 'relative',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sellerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  starRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  reputationPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reputationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  sellerSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  sellerSecurityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  escrowCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 22,
    padding: 16,
    marginBottom: 28,
  },
  escrowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  escrowShieldCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A3412',
  },
  escrowSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C2410C',
    marginTop: 1,
  },
  escrowBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  escrowPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  escrowPointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  escrowPointText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  chatBtn: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  primaryExchangeBtn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 6,
  },
  charityExchangeBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  primaryExchangeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  adminActionBar: {
    flexDirection: 'row',
    gap: 10,
  },
  adminActionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  adminRejectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  adminRejectBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 13,
  },
  adminApproveBtn: {
    backgroundColor: '#10B981',
  },
  adminApproveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  userPendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  userPendingNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  ownProductBottomRow: {
    gap: 10,
  },
  ownProductNotice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  ownProductNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  editMyPostBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.btn,
  },
  editMyPostBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  pendingAdminBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  pendingBadgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAdminTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  pendingAdminSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
    marginTop: 2,
  },
});

export default ProductDetailScreen;
