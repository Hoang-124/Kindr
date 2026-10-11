// client/src/features/admin/screens/ManageWaitlistScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { Mail, Phone, Calendar, UserCheck, Search, Sparkles, ExternalLink } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';
import { api } from '../../../services/api';

interface WaitlistEntry {
  _id: string;
  email: string;
  phone?: string;
  orderNumber: number;
  userRole?: string;
  interest?: string;
  utmSource?: string;
  createdAt: string;
}

export const ManageWaitlistScreen = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWaitlist = async () => {
    try {
      const res = await api.get('/waitlist/entries?limit=100');
      if (res.data?.success && Array.isArray(res.data?.entries)) {
        setEntries(res.data.entries);
        setTotal(res.data.total ?? res.data.entries.length);
      }
    } catch (err) {
      console.warn('Failed to fetch waitlist entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWaitlist();
    setRefreshing(false);
  };

  const filteredEntries = entries.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.email?.toLowerCase().includes(q) ||
      (e.phone && e.phone.includes(q)) ||
      (e.interest && e.interest.toLowerCase().includes(q))
    );
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Danh Sách Chờ (Waitlist)" showBack />

      <View style={styles.container}>
        {/* Metric summary banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tổng mẹ đã đăng ký</Text>
            <Text style={styles.statValue}>{total}</Text>
          </View>
          <View style={styles.badgeLive}>
            <Sparkles size={14} color={COLORS.primary} />
            <Text style={styles.badgeLiveText}>Landing Page Live</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo email, số điện thoại..."
            placeholderTextColor={COLORS.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách chờ...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <UserCheck size={48} color={COLORS.outline} />
                <Text style={styles.emptyTitle}>Chưa có ai đăng ký</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Các lượt đăng ký từ landing page sẽ xuất hiện tại đây.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Card style={styles.entryCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                  </View>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {item.userRole === 'father' ? 'Bố bỉm sữa' : item.userRole === 'pregnant' ? 'Mẹ bầu' : 'Mẹ bỉm sữa'}
                    </Text>
                  </View>
                </View>

                {/* Email row */}
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`mailto:${item.email}`)}
                  activeOpacity={0.7}
                >
                  <Mail size={16} color={COLORS.primary} />
                  <Text style={styles.emailText}>{item.email}</Text>
                  <ExternalLink size={12} color={COLORS.outline} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {/* Phone row */}
                {Boolean(item.phone) && (
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => Linking.openURL(`tel:${item.phone}`)}
                    activeOpacity={0.7}
                  >
                    <Phone size={16} color={COLORS.secondary} />
                    <Text style={styles.phoneText}>{item.phone}</Text>
                    <ExternalLink size={12} color={COLORS.outline} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}

                {/* Interest & Date */}
                <View style={styles.metaRow}>
                  {Boolean(item.interest) && (
                    <Text style={styles.interestText}>Quan tâm: {item.interest}</Text>
                  )}
                  <View style={styles.dateRow}>
                    <Calendar size={13} color={COLORS.outline} />
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.sm,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  statBox: {
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    ...SHADOWS.soft,
  },
  badgeLiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    marginBottom: SPACING.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurface,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.outline,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  entryCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  orderBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.onPrimary,
  },
  roleBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginLeft: 8,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginLeft: 8,
  },
  metaRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.outline,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: SPACING.lg,
  },
});

export default ManageWaitlistScreen;
