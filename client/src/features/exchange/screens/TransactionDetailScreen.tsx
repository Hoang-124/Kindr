// src/features/exchange/screens/TransactionDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  TextInput,
  Alert 
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { confirmHandover, finalizeSafefulTime, fileDispute, confirmHandoverAsync, completeTransactionAsync, fileDisputeAsync } from '../store/exchangeSlice';
import { updateUserBalance, adjustCivilizationPoints, updateUserReputation, addStrikeToUser, refreshWalletBalance } from '../../auth/store/authSlice';
import { submitReport } from '../../trust-safety/store/reportSlice';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Button from '../../../components/common/Button';
import Card from '../../../components/layout/Card';
import MascotIcon from '../../../components/common/MascotIcon';
import ModalConfirm from '../../../components/common/ModalConfirm';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Phone,
  MessageCircle,
  AlertTriangle
} from 'lucide-react-native';

type TransactionDetailRouteProp = RouteProp<AppStackParamList, 'TransactionDetail'>;
type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const TransactionDetailScreen = () => {
  const route = useRoute<TransactionDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { id } = route.params;

  const transactions = useAppSelector((state) => state.exchange.transactions);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const tx = transactions.find(t => t.id === id);

  // Dispute & Report Modal State
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReasonText, setDisputeReasonText] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReasonText, setReportReasonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('6h 00m');

  // Countdown timer for 6 Hours Safeful Time
  useEffect(() => {
    if (!tx?.safefulTimeExpiresAt || tx.status !== 'in_safeful_time') return;

    const interval = setInterval(() => {
      const expires = new Date(tx.safefulTimeExpiresAt!).getTime();
      const now = Date.now();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeftStr('Hết giờ - Hoàn tất');
        clearInterval(interval);
        // Auto-finalize if expired
        dispatch(finalizeSafefulTime({ transactionId: tx.id }));
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tx?.safefulTimeExpiresAt, tx?.status]);

  if (!tx) {
    return (
      <ScreenContainer loading={false} style={styles.errorContainer}>
        <Header showBack />
        <Text style={styles.errorText}>Không tìm thấy thông tin giao dịch.</Text>
      </ScreenContainer>
    );
  }

  const isBuyer = tx.buyerId === currentUser?.id;
  const isSeller = tx.sellerId === currentUser?.id;

  // Handover confirmation ("Đã nhận hàng" -> triggers 6h Safeful Time)
  const handleHandoverConfirm = () => {
    Alert.alert(
      'Xác nhận nhận đồ P2P 📦',
      'Mẹ đã gặp mặt nhận đồ trực tiếp hoặc từ shipper? Hệ thống sẽ kích hoạt ngay khung giờ 6 tiếng kiểm định tại nhà!',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu 6h Safeful Time',
          onPress: async () => {
            try {
              await dispatch(confirmHandoverAsync(tx.id)).unwrap();
            } catch (e) {
              dispatch(confirmHandover({ transactionId: tx.id }));
            }
            Alert.alert('Đã kích hoạt 6h Bảo Chứng! ⏱️', 'Mẹ có 6 tiếng kiểm tra bánh xe, chi tiết đồ dùng tại nhà.');
          }
        }
      ]
    );
  };

  // Immediate manual confirmation without waiting 6h
  const handleImmediateComplete = () => {
    Alert.alert(
      'Xác nhận hài lòng 100% ✨',
      'Mẹ xác nhận món đồ hoàn toàn đúng mô tả và đồng ý giải phóng Xu ngay cho người bán?',
      [
        { text: 'Chờ hết 6h', style: 'cancel' },
        {
          text: 'Giải phóng Xu ngay',
          onPress: async () => {
            try {
              await dispatch(completeTransactionAsync(tx.id)).unwrap();
              dispatch(refreshWalletBalance());
            } catch (e) {
              dispatch(finalizeSafefulTime({ transactionId: tx.id }));
              dispatch(updateUserBalance({ userId: tx.sellerId, amount: tx.buyerEscrowFrozen + tx.sellerEscrowFrozen }));
              dispatch(adjustCivilizationPoints({ userId: tx.buyerId, points: 5, reason: 'Giao dịch văn minh mượt mà' }));
              dispatch(adjustCivilizationPoints({ userId: tx.sellerId, points: 5, reason: 'Đồ dùng đúng 100% mô tả' }));
            }

            Alert.alert('Giao dịch thành công! 🎉', 'Xu đã vào ví người bán.', [
              { text: 'Đánh giá 5 sao ⭐', onPress: () => navigation.navigate('RatingReview', { transactionId: tx.id }) }
            ]);
          }
        }
      ]
    );
  };

  // Dispute submission
  const handleFileDispute = () => {
    if (!disputeReasonText.trim()) {
      Alert.alert('Chưa nhập lý do', 'Vui lòng nhập lý do khiếu nại.');
      return;
    }

    dispatch(fileDispute({ transactionId: tx.id, reason: disputeReasonText }));
    setDisputeModalVisible(false);
    Alert.alert('Đã nộp Khiếu Nại ⚠️', 'Bộ phận Trust & Safety sẽ liên hệ đối soát chứng cứ trong vòng 24h.');
  };

  // Report submission
  const handleFileReport = () => {
    if (!reportReasonText.trim() || !currentUser) return;

    dispatch(submitReport({
      targetType: 'user',
      targetId: isBuyer ? tx.sellerId : tx.buyerId,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reason: reportReasonText,
    }));

    setReportModalVisible(false);
    Alert.alert('Đã gửi báo cáo 🛡️', 'Kindr cảm ơn mẹ đã đóng góp xây dựng môi trường an toàn.');
  };

  return (
    <ScreenContainer scrollable>
      <Header title="Chi tiết Ký Quỹ Escrow" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Header Banner */}
        <View style={[
          styles.statusBanner,
          tx.status === 'completed' ? styles.statusCompleted :
          tx.status === 'disputed' ? styles.statusDisputed :
          tx.status === 'in_safeful_time' ? styles.statusSafeful : styles.statusFrozen
        ]}>
          {tx.status === 'completed' ? (
            <ShieldCheck size={26} color="#FFF" />
          ) : tx.status === 'disputed' ? (
            <ShieldAlert size={26} color="#FFF" />
          ) : (
            <Lock size={26} color="#FFF" />
          )}

          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {tx.status === 'awaiting_handover' ? '🔒 ĐANG TẠM KHÓA XU KÝ QUỸ' :
               tx.status === 'in_safeful_time' ? '⏱️ BẢO CHỨNG 6 GIỜ KIỂM ĐỊNH' :
               tx.status === 'completed' ? '✅ GIAO DỊCH THÀNH CÔNG' : '⚠️ TRANH CHẤP ĐANG XỬ LÝ'}
            </Text>
            <Text style={styles.statusSub}>
              {tx.status === 'awaiting_handover' ? 'Xu cả 2 bên được bảo hộ an toàn trong Rương Escrow.' :
               tx.status === 'in_safeful_time' ? `Đếm ngược kiểm định tại nhà: ${timeLeftStr}` :
               tx.status === 'completed' ? 'Xu đã tự động giải phóng vào ví người bán.' : 'Ban quản trị Kindr đang kiểm tra chứng cứ.'}
            </Text>
          </View>
        </View>

        {/* Product Card Summary */}
        <Card style={styles.productCard}>
          <Image source={{ uri: tx.productImage }} style={styles.prodImg} />
          <View style={styles.prodDetails}>
            <Text style={styles.prodName} numberOfLines={2}>{tx.productName}</Text>
            <Text style={styles.prodPrice}>🪙 Giá đổi: {tx.productPrice} Xu</Text>
          </View>
        </Card>

        {/* Mascot Escrow Dialogue */}
        <View style={styles.mascotBox}>
          <MascotIcon 
            size={56} 
            mood={tx.status === 'completed' ? 'celebrate' : 'protective'} 
            dialogue={tx.status === 'completed'
              ? "Gấu Kindy đã giải phóng Xu thành công cho 2 mẹ nhé!"
              : "Mẹ an tâm! Gấu đang giữ hộ Xu trong rương, kiểm tra 6 tiếng thoải mái nhe!"}
          />
        </View>

        {/* Unlocked Contact Information (SĐT / Zalo) */}
        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>📞 Thông tin liên hệ trực tiếp (Đã mở khóa)</Text>
          <Text style={styles.contactSub}>Dùng để hai bên tự thỏa thuận giao nhận P2P tiện đường đi chợ/đón con</Text>
          
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Đối tác giao dịch:</Text>
            <Text style={styles.contactName}>{isBuyer ? tx.sellerName : tx.buyerName}</Text>
          </View>

          <View style={styles.contactRow}>
            <Phone size={16} color={COLORS.primary} />
            <Text style={styles.contactValue}>{isBuyer ? (tx.sellerPhone || '0905234567') : (tx.buyerPhone || '0905123456')}</Text>
          </View>

          <View style={styles.contactRow}>
            <MessageCircle size={16} color={COLORS.accentGold} />
            <Text style={styles.contactValue}>Zalo: {isBuyer ? (tx.sellerZalo || '0905234567') : (tx.buyerZalo || '0905123456')}</Text>
          </View>
        </Card>

        {/* Double Escrow Values Box */}
        <View style={styles.escrowBox}>
          <View style={styles.escrowColumn}>
            <Text style={styles.escrowRole}>Mẹ Mua (Khóa 100%)</Text>
            <Text style={styles.escrowXu}>{tx.buyerEscrowFrozen} Xu</Text>
          </View>
          <View style={styles.escrowDivider} />
          <View style={styles.escrowColumn}>
            <Text style={styles.escrowRole}>Mẹ Bán (Safe Fee 10%)</Text>
            <Text style={styles.escrowXu}>{tx.sellerEscrowFrozen} Xu</Text>
          </View>
        </View>

        {/* Dynamic Action Buttons */}
        {tx.status === 'awaiting_handover' && isBuyer && (
          <Button
            title="Đã gặp mặt / Nhận đồ P2P (Bắt đầu 6h)"
            onPress={handleHandoverConfirm}
            style={styles.actionBtn}
          />
        )}

        {tx.status === 'in_safeful_time' && isBuyer && (
          <View style={styles.buyerActionGroup}>
            <Button
              title="Đúng mô tả 100% - Giải phóng Xu ngay"
              onPress={handleImmediateComplete}
              style={styles.actionBtn}
            />
            <TouchableOpacity style={styles.disputeBtn} onPress={() => setDisputeModalVisible(true)}>
              <Text style={styles.disputeBtnText}>⚠️ Báo lỗi / Khiếu nại chất lượng</Text>
            </TouchableOpacity>
          </View>
        )}

        {tx.status === 'completed' && (
          <Button
            title="Đánh giá Mẹ Bỉm Văn Minh ⭐"
            onPress={() => navigation.navigate('RatingReview', { transactionId: tx.id })}
            style={styles.actionBtn}
          />
        )}

        {/* Report Action for Trust & Safety */}
        <TouchableOpacity style={styles.reportRow} onPress={() => setReportModalVisible(true)}>
          <AlertTriangle size={14} color={COLORS.outline} />
          <Text style={styles.reportText}>Báo cáo vi phạm về giao dịch này</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Dispute Modal */}
      <ModalConfirm
        visible={disputeModalVisible}
        onClose={() => setDisputeModalVisible(false)}
        onConfirm={handleFileDispute}
        loading={loading}
        title="⚠️ Nộp khiếu nại chất lượng"
        confirmTitle="Gửi khiếu nại"
        confirmVariant="error"
        description="Nhập lý do chi tiết (ví dụ: đồ chơi hư bánh, sách rách trang...). Trạm tạm khóa sẽ đóng băng Xu để đối soát chứng cứ."
      >
        <TextInput
          style={styles.modalInput}
          placeholder="Mô tả lý do khiếu nại..."
          placeholderTextColor={COLORS.outline}
          value={disputeReasonText}
          onChangeText={setDisputeReasonText}
          multiline
          numberOfLines={3}
        />
      </ModalConfirm>

      {/* Report User Modal */}
      <ModalConfirm
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onConfirm={handleFileReport}
        title="🛡️ Báo cáo vi phạm đối tác"
        confirmTitle="Gửi báo cáo"
        confirmVariant="primary"
        description="Mô tả vi phạm của tài khoản này (spam, thái độ không văn minh, hét giá ngoài app...)"
      >
        <TextInput
          style={styles.modalInput}
          placeholder="Nội dung báo cáo..."
          placeholderTextColor={COLORS.outline}
          value={reportReasonText}
          onChangeText={setReportReasonText}
          multiline
          numberOfLines={3}
        />
      </ModalConfirm>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  errorContainer: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: COLORS.error, marginTop: SPACING.xl },
  scrollContent: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.sm, paddingBottom: 60 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.default, gap: SPACING.md, marginBottom: SPACING.md },
  statusFrozen: { backgroundColor: COLORS.tertiary },
  statusSafeful: { backgroundColor: COLORS.primary },
  statusCompleted: { backgroundColor: COLORS.primary },
  statusDisputed: { backgroundColor: COLORS.error },
  statusTextContainer: { flex: 1 },
  statusTitle: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  statusSub: { fontSize: 11, color: '#FFF', marginTop: 2 },
  productCard: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md, alignItems: 'center' },
  prodImg: { width: 56, height: 56, borderRadius: 10, backgroundColor: COLORS.surfaceContainer },
  prodDetails: { flex: 1 },
  prodName: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  prodPrice: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  mascotBox: { alignItems: 'center', marginVertical: SPACING.xs },
  contactCard: { marginBottom: SPACING.md, backgroundColor: COLORS.surfaceContainerLow },
  contactTitle: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface, marginBottom: 2 },
  contactSub: { fontSize: 11, color: COLORS.outline, marginBottom: SPACING.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  contactLabel: { fontSize: 12, color: COLORS.outline },
  contactName: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface },
  contactValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  escrowBox: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.default, padding: SPACING.md, marginBottom: SPACING.lg, alignItems: 'center' },
  escrowColumn: { flex: 1, alignItems: 'center' },
  escrowRole: { fontSize: 11, color: COLORS.outline },
  escrowXu: { fontSize: 16, fontWeight: '800', color: COLORS.tertiary, marginTop: 2 },
  escrowDivider: { width: 1, height: 30, backgroundColor: COLORS.surfaceVariant },
  buyerActionGroup: { gap: SPACING.xs },
  actionBtn: { height: 50, marginBottom: SPACING.xs },
  disputeBtn: { height: 42, justifyContent: 'center', alignItems: 'center' },
  disputeBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 12 },
  reportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: SPACING.md },
  reportText: { fontSize: 11, color: COLORS.outline },
  modalInput: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: RADIUS.default, padding: SPACING.sm, height: 75, marginTop: SPACING.xs, color: COLORS.onSurface, textAlignVertical: 'top' },
});

export default TransactionDetailScreen;
