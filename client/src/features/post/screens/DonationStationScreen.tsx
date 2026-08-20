// src/features/post/screens/DonationStationScreen.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert 
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { Gift, MapPin, Phone, Clock, HeartHandshake } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';

interface Station {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  hours: string;
  itemsCount: number;
  image: string;
}

const STATIONS: Station[] = [
  {
    id: 'st_1',
    name: 'Trạm Tặng Đồ Hải Châu 💖',
    address: '45 Trần Phú, P. Phước Ninh, Q. Hải Châu, Đà Nẵng',
    district: 'Hải Châu',
    phone: '0905 111 222',
    hours: '08:00 - 17:30 (T2 - CN)',
    itemsCount: 15,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTJXjwnrZcS6bvtvVGWEi2tgqKWa9ZUihAtwHbDF5FHJ6SmwQevjLyXaXIrAtfdPiKD0X3NB8cA7OmXnMoPqOEk0J7Vubi1HernCg11sY9BXocOex5JLEZlMpLtn5Z6FLZ67i3zxsXqXPy0mNHhJcwSB0R298mme5On8ZjDhGjixiZ6XkIxFJo7NCSfiC0XQ9WTCxEsnlR60ZCnXJLogV3_crlu1T1VegS8ic5aO3E0KNBGS6AlejNMMEUv80oWWGHpKasRTY4RXuw',
  },
  {
    id: 'st_2',
    name: 'Trạm Tặng Đồ Thanh Khê 🧸',
    address: '112 Điện Biên Phủ, P. Chính Gián, Q. Thanh Khê, Đà Nẵng',
    district: 'Thanh Khê',
    phone: '0905 333 444',
    hours: '08:00 - 17:30 (T2 - CN)',
    itemsCount: 8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHLm7v1mrikcPBK320JSApGO85xBmOXjFLT-iASjSP3fSYUgLSRRmzhHjw9zxoQbzRtW_96jdRqPdEB2bgCgOF6oNN4yqphf9Her3dQ_YkIZjANWvtkDjfhO3rKTfJEEUssk6PG20LxQRsxuLLxf5GfCXqn_RpKi2ImHQc-ZqgkicshoXurNiiEZzReeFfdkb_O7-ulQ1G_ArHN8q-8QJN92rwT2Cio4oSD59_H5htNFcQj3beQ99lH0DLyzcjgYJ27i08arcO4ahC',
  },
  {
    id: 'st_3',
    name: 'Trạm Tặng Đồ Sơn Trà 🍼',
    address: '23 Ngô Quyền, P. An Hải Bắc, Q. Sơn Trà, Đà Nẵng',
    district: 'Sơn Trà',
    phone: '0905 555 666',
    hours: '08:30 - 17:00 (T2 - T7)',
    itemsCount: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEymEhhOzQ94Wb75d90oia7jzn7EW3FrnOW69g4JOwMYfnuF8a5ZkOPeLopzXieitglTsgKuVJav8unMM6YsBFfr5CSqZZ3lCsFzz0aAqzNfwkCPXLDCeU8XYzTcw4CO1_ldMzPO6Yx5T_-zuXnRIGUxZwfeCAsM8UCgUmwWlCtvS-VGpM2Vz3lZ1D3l6OHRhMnWQAvNc2QQccfdEAfp2FGTYfu-FT8j7PAb2d2-IXGqBuqkKYMTDjzCzwAY_JE_c8ArC19QFm3Api',
  },
];

export const DonationStationScreen = () => {
  const handleDepositClick = (stationName: string) => {
    Alert.alert(
      'Ký gửi đồ dùng 🎁',
      `Mẹ muốn đăng ký mang đồ dùng không dùng nữa tới ký gửi tại "${stationName}"?\n\nNhân viên trạm sẽ tiếp nhận, phân loại vệ sinh và tặng lại 0 Xu cho các mẹ bỉm khó khăn khác. Mẹ sẽ được cộng điểm Mẹ bỉm văn minh.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng ký ký gửi', onPress: () => Alert.alert('Đăng ký thành công', 'Mẹ vui lòng mang đồ dùng tới trạm trong khung giờ hoạt động nhé!') }
      ]
    );
  };

  const handleBrowseItems = (stationName: string, count: number) => {
    Alert.alert(
      'Nhận đồ 0 Xu 👶',
      `Trạm "${stationName}" hiện có ${count} đồ dùng dành cho mẹ và bé đang sẵn sàng trao tặng.\n\nMẹ có thể tới trạm trực tiếp hoặc đăng ký với tình nguyện viên qua số điện thoại hỗ trợ của trạm.`,
      [{ text: 'Đã hiểu' }]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Trạm Tặng Đồ Kindr" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBanner}>
          <HeartHandshake size={32} color={COLORS.onPrimary} style={{ marginBottom: 6 }} />
          <Text style={styles.heroTitle}>Trạm Trao Yêu Thương</Text>
          <Text style={styles.heroText}>
            Nơi tập kết đồ quyên góp của các mẹ bỉm. Toàn bộ đồ chơi, quần áo cũ được kiểm tra vệ sinh, đóng gói sạch sẽ và chia sẻ 0 Xu tới các hoàn cảnh cần giúp đỡ.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Các điểm Trạm Kindr tại Đà Nẵng:</Text>

        {STATIONS.map((station) => (
          <Card key={station.id} style={styles.stationCard} contentStyle={styles.cardContent}>
            <Image source={{ uri: station.image }} style={styles.stationImg} />
            
            <View style={styles.stationDetails}>
              <Text style={styles.stationName}>{station.name}</Text>
              
              <View style={styles.infoRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.infoText}>{station.address}</Text>
              </View>

              <View style={styles.infoRow}>
                <Clock size={14} color={COLORS.outline} />
                <Text style={styles.infoText}>{station.hours}</Text>
              </View>

              <View style={styles.infoRow}>
                <Phone size={14} color={COLORS.outline} />
                <Text style={styles.infoText}>Hotline: {station.phone}</Text>
              </View>
              
              <View style={styles.badgeRow}>
                <View style={styles.itemsBadge}>
                  <Gift size={12} color={COLORS.primary} />
                  <Text style={styles.itemsBadgeText}>{station.itemsCount} đồ dùng sẵn có</Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.btn, styles.secondaryBtn]}
                  onPress={() => handleBrowseItems(station.name, station.itemsCount)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>Xem đồ 0 Xu</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btn, styles.primaryBtn]}
                  onPress={() => handleDepositClick(station.name)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Đến ký gửi đồ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
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
  heroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: SPACING.md + 4,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.ambient,
  },
  heroTitle: {
    ...TYPOGRAPHY.headlineSm,
    fontWeight: '800',
    color: COLORS.onPrimary,
    marginBottom: 4,
  },
  heroText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  stationCard: {
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 0,
  },
  stationImg: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surfaceContainer,
  },
  stationDetails: {
    padding: SPACING.md,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs + 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 3,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  itemsBadge: {
    backgroundColor: COLORS.primaryContainer + '40',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemsBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
});

export default DonationStationScreen;
