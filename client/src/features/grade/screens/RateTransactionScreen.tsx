// src/features/grade/screens/RateTransactionScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { submitRating } from '../store/ratingSlice';
import { updateUserReputation, adjustCivilizationPoints, refreshWalletBalance } from '../../auth/store/authSlice';
import { markRated } from '../../exchange/store/exchangeSlice';
import * as ratingService from '../../../services/ratingService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Button from '../../../components/common/Button';
import MascotIcon from '../../../components/common/MascotIcon';
import { Star } from 'lucide-react-native';

type RateRouteProp = RouteProp<AppStackParamList, 'RatingReview'>;

export const RateTransactionScreen = () => {
  const route = useRoute<RateRouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const { transactionId } = route.params;
  const transactions = useAppSelector((state) => state.exchange.transactions);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const tx = transactions.find(t => t.id === transactionId);

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!tx || !currentUser) {
    return (
      <ScreenContainer style={styles.center}>
        <Header showBack />
        <Text style={styles.errorText}>Không tìm thấy thông tin giao dịch.</Text>
      </ScreenContainer>
    );
  }

  const isBuyer = tx.buyerId === currentUser.id;
  const targetUserId = isBuyer ? tx.sellerId : tx.buyerId;
  const targetUserName = isBuyer ? tx.sellerName : tx.buyerName;

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // 1. Call real API
      await ratingService.submitRating({
        transactionId: tx.id,
        stars,
        comment: comment.trim() || 'Giao dịch văn minh mượt mà! ❤️',
      });
      dispatch(refreshWalletBalance());
    } catch (e) {
      // 2. Fallback
      dispatch(submitRating({
        transactionId: tx.id,
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        fromUserAvatar: currentUser.avatar,
        toUserId: targetUserId,
        stars,
        comment: comment.trim() || 'Giao dịch văn minh mượt mà! ❤️',
      }));

      dispatch(updateUserReputation({ userId: targetUserId, newStars: stars }));
      dispatch(adjustCivilizationPoints({ userId: currentUser.id, points: 2, reason: 'Gửi đánh giá văn minh cho đối tác' }));
    }

    dispatch(markRated({ transactionId: tx.id, isBuyer }));
    setLoading(false);

    Alert.alert(
      'Đã gửi đánh giá 🎉',
      `Cảm ơn mẹ đã đóng góp ý kiến cho ${targetUserName}! Mẹ được thưởng +2 điểm Mẹ Bỉm Văn Minh.`,
      [{ text: 'Trở về', onPress: () => navigation.navigate('Home') }]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Đánh giá Mẹ Bỉm Văn Minh" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mascotWrapper}>
          <MascotIcon 
            size={70} 
            mood="celebrate" 
            dialogue={`Giao dịch hoàn tất! Mẹ thấy ${targetUserName} giao dịch thế nào?`}
          />
        </View>

        <Text style={styles.targetName}>Đánh giá dành cho: {targetUserName}</Text>
        <Text style={styles.productName}>Món đồ: "{tx.productName}"</Text>

        {/* Star Rating Picker */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setStars(s)} activeOpacity={0.7}>
              <Star 
                size={36} 
                color={s <= stars ? COLORS.accentGold : COLORS.outlineVariant} 
                fill={s <= stars ? COLORS.accentGold : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.starHint}>{stars === 5 ? 'Tuyệt vời (5 Sao)' : `${stars} Sao`}</Text>

        {/* Comment Input */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Nhận xét văn minh (Không bắt buộc):</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="VD: Mẹ đóng gói cẩn thận, đúng hẹn, đồ rất mới..."
            placeholderTextColor={COLORS.outline}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />
        </View>

        <Button
          title="Gửi đánh giá ⭐"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: COLORS.error, marginTop: SPACING.xl },
  content: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, alignItems: 'center' },
  mascotWrapper: { marginBottom: SPACING.md },
  targetName: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface, marginBottom: 4 },
  productName: { fontSize: 13, color: COLORS.outline, marginBottom: SPACING.lg },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.xs },
  starHint: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.lg },
  inputBox: { width: '100%', marginBottom: SPACING.xl },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface, marginBottom: SPACING.xs },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.default,
    padding: SPACING.md,
    height: 90,
    color: COLORS.onSurface,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  submitBtn: { width: '100%', height: 50 },
});

export default RateTransactionScreen;
