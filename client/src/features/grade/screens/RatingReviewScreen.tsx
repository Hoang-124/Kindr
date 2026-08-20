// src/features/grade/screens/RatingReviewScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { adjustCivilizationPoints } from '../../auth/store/authSlice';
import { updateTransactionStatus } from '../../exchange/store/exchangeSlice';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { Star, MessageSquare, Award } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const QUICK_TAGS = [
  'Đồ mới đúng mô tả 👕',
  'Giao hàng nhanh chóng ⚡',
  'Mẹ bỉm rất thân thiện 😊',
  'Đóng gói cẩn thận 📦',
  'Đồ dùng sạch sẽ 🧼',
];

export const RatingReviewScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { transactionId } = route.params || {};
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const transactions = useAppSelector((state) => state.exchange.transactions);
  const tx = transactions.find(t => t.id === transactionId);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!tx || !currentUser) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Không tìm thấy giao dịch" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Giao dịch không tồn tại hoặc lỗi tải dữ liệu.</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Partner is the other person in the transaction
  const isBuyer = tx.buyerId === currentUser.id;
  const partnerId = isBuyer ? tx.sellerId : tx.buyerId;
  const partnerName = isBuyer ? tx.sellerName : tx.buyerName;

  const handleTagPress = (tag: string) => {
    if (comment.includes(tag)) return;
    setComment(prev => prev ? `${prev}, ${tag}` : tag);
  };

  const handleSubmit = () => {
    setLoading(true);

    // Calculate Civilization Points changes for the partner based on stars:
    // 5 stars: +5 pts
    // 4 stars: +2 pts
    // 3 stars: +0 pts
    // 1-2 stars: -5 pts
    let pointsChanged = 0;
    let reason = '';

    if (rating === 5) {
      pointsChanged = 5;
      reason = `Được ${currentUser.name} đánh giá 5 sao: "${comment || 'Giao dịch tuyệt vời'}"`;
    } else if (rating === 4) {
      pointsChanged = 2;
      reason = `Được ${currentUser.name} đánh giá 4 sao: "${comment || 'Khá tốt'}"`;
    } else if (rating <= 2) {
      pointsChanged = -5;
      reason = `Bị ${currentUser.name} đánh giá thấp (${rating} sao): "${comment || 'Có lỗi xảy ra'}"`;
    }

    setTimeout(() => {
      setLoading(false);
      
      // Update partner civilization points in state
      if (pointsChanged !== 0) {
        dispatch(adjustCivilizationPoints({
          userId: partnerId,
          points: pointsChanged,
          reason,
        }));
      }

      // Mark transaction as complete if it wasn't already, or save metadata.
      dispatch(updateTransactionStatus({
        transactionId: tx.id,
        status: 'completed',
        finalizedAt: new Date().toISOString()
      }));

      Alert.alert(
        'Đã gửi đánh giá! 🌟',
        `Cảm ơn mẹ đã đóng góp ý kiến. Điểm văn minh của ${partnerName} đã được cập nhật tương ứng.`,
        [{ text: 'Đồng ý', onPress: () => navigation.navigate('Main') }]
      );
    }, 1200);
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Đánh Giá Giao Dịch" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.partnerCard}>
          <Award size={32} color={COLORS.primary} />
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerTitle}>Đánh giá đối tác giao dịch:</Text>
            <Text style={styles.partnerName}>{partnerName}</Text>
          </View>
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          Đồ dùng: {tx.productName}
        </Text>

        {/* Rating Stars Selection */}
        <Text style={styles.sectionTitle}>Mẹ đánh giá bao nhiêu sao?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              activeOpacity={0.7}
              style={styles.starBtn}
            >
              <Star 
                size={36} 
                fill={star <= rating ? COLORS.accentGold : 'transparent'} 
                color={star <= rating ? COLORS.accentGold : COLORS.outlineVariant} 
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 5 ? 'Cực kỳ hài lòng (5/5)' :
           rating === 4 ? 'Hài lòng (4/5)' :
           rating === 3 ? 'Bình thường (3/5)' :
           rating === 2 ? 'Không hài lòng (2/5)' : 'Rất tệ (1/5)'}
        </Text>

        {/* Quick Review Tags */}
        <Text style={styles.sectionTitle}>Chọn nhanh nhận xét:</Text>
        <View style={styles.tagsGrid}>
          {QUICK_TAGS.map((tag, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.tagBadge}
              onPress={() => handleTagPress(tag)}
              activeOpacity={0.8}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Comment */}
        <Input
          label="Nhận xét chi tiết của mẹ"
          placeholder="Chia sẻ trải nghiệm giao dịch thực tế của mẹ..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          style={styles.commentInput}
          icon={<MessageSquare size={20} color={COLORS.outline} />}
        />

        <Button
          title="Gửi đánh giá & Hoàn tất"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryContainer + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    padding: SPACING.md,
    borderRadius: 20,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerTitle: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '600',
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  productName: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  starBtn: {
    padding: SPACING.xs,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.lg,
  },
  tagBadge: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    ...SHADOWS.soft,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  commentInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  submitBtn: {
    marginTop: SPACING.lg,
    height: 52,
  },
});

export default RatingReviewScreen;
