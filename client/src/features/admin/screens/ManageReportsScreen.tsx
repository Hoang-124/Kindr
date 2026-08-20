import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { hydrateProducts } from '../../home/store/homeSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react-native';
import { formatFullDate } from '../../../utils/formatDate';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

interface ReportItem {
  id: string;
  productId: string;
  productName: string;
  reportedBy: string;
  reason: string;
  createdAt: string;
}

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep_1',
    productId: 'prod_1',
    productName: 'Đồ chơi gỗ xếp hình khối cho bé 1-3 tuổi',
    reportedBy: 'Mẹ Bắp',
    reason: 'Đăng sai danh mục sản phẩm và có ngôn từ không phù hợp trong phần mô tả chi tiết.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

export const ManageReportsScreen = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.home.products);
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);

  useEffect(() => {
    api.get('/admin/reports')
      .then(res => {
        const list = res.data.reports || res.data;
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((r: any) => ({
            id: r.id || r._id,
            productId: r.productId?.id || r.productId?._id || r.productId || 'prod_1',
            productName: r.productId?.name || 'Món đồ báo cáo',
            reportedBy: r.reporterId?.name || 'Mẹ Bỉm',
            reason: r.reason || 'Vi phạm chính sách cộng đồng',
            createdAt: r.createdAt || new Date().toISOString(),
          }));
          setReports(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleIgnore = async (id: string) => {
    try {
      await api.put(`/admin/reports/${id}/dismiss`);
    } catch (e) {}
    setReports(prev => prev.filter(r => r.id !== id));
    Alert.alert('Thành công', 'Đã bỏ qua báo cáo này. Bài đăng vẫn hiển thị bình thường.');
  };

  const handleRemovePost = async (reportId: string, productId: string, productName: string) => {
    Alert.alert(
      'Gỡ bài đăng vi phạm? 🗑️',
      `Mẹ có chắc chắn muốn gỡ bỏ hoàn toàn bài đăng: "${productName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gỡ bài đăng',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/products/${productId}`);
              await api.put(`/admin/reports/${reportId}/dismiss`);
            } catch (e) {}

            const updatedProducts = products.filter(p => p.id !== productId);
            dispatch(hydrateProducts(updatedProducts));
            setReports(prev => prev.filter(r => r.id !== reportId));
            
            Alert.alert('Thành công', 'Đã gỡ bài đăng vi phạm và đóng báo cáo này.');
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Báo Cáo Vi Phạm" showBack />
      
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={48} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Hộp thư báo cáo sạch sẽ. Không có vi phạm nào.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <AlertTriangle size={18} color={COLORS.error} />
              <Text style={styles.reportLabel}>Báo cáo vi phạm</Text>
            </View>

            <Text style={styles.prodName}>Sản phẩm bị báo cáo: {item.productName}</Text>
            <Text style={styles.reporter}>Bởi: {item.reportedBy} • {formatFullDate(item.createdAt)}</Text>
            
            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>Nội dung báo cáo:</Text>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.ignoreBtn]}
                onPress={() => handleIgnore(item.id)}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={14} color={COLORS.primary} />
                <Text style={styles.btnTextIgnore}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleRemovePost(item.id, item.productId, item.productName)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color="#ffffff" />
                <Text style={styles.btnTextDelete}>Gỡ bài đăng</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 120,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.outline,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  reporter: {
    fontSize: 9,
    color: COLORS.outline,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  reasonBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: SPACING.md,
  },
  reasonTitle: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '700',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 11,
    color: COLORS.onSurface,
    lineHeight: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceVariant,
    marginVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...SHADOWS.soft,
  },
  ignoreBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#ffffff',
  },
  btnTextIgnore: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  deleteBtn: {
    backgroundColor: COLORS.error,
  },
  btnTextDelete: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default ManageReportsScreen;
