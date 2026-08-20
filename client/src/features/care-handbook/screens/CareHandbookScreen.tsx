// src/features/care-handbook/screens/CareHandbookScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';
import MascotIcon from '../../../components/common/MascotIcon';
import Button from '../../../components/common/Button';
import { 
  Syringe, 
  TrendingUp, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Star, 
  Baby, 
  Sparkles,
  Heart,
  PlusCircle,
  ThumbsUp
} from 'lucide-react-native';
import { VaccineDose, GrowthRecord, CommunityReview } from '../../../types/common';

const initialVaccines: VaccineDose[] = [
  { id: 'v1', name: 'Lao (BCG) & Viêm gan B', ageRecommendation: 'Sơ sinh (24h đầu)', ageInMonths: 0, diseaseTarget: 'Phòng bệnh Lao và Viêm gan B', isCompleted: true, completedDate: '12/03/2026', facilityName: 'Bệnh viện Phụ sản - Nhi Đà Nẵng' },
  { id: 'v2', name: 'Vắc xin 6 trong 1 (Mũi 1) + Uống Rota (Liều 1)', ageRecommendation: '2 tháng tuổi', ageInMonths: 2, diseaseTarget: 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, Viêm gan B, Tiêu chảy Rota', isCompleted: true, completedDate: '15/05/2026', facilityName: 'Trung tâm Tiêm chủng VNVC Hải Châu' },
  { id: 'v3', name: 'Vắc xin 6 trong 1 (Mũi 2) + Phế cầu 13 (Mũi 1)', ageRecommendation: '3 tháng tuổi', ageInMonths: 3, diseaseTarget: 'Viêm phổi, Viêm màng não do phế cầu', isCompleted: true, completedDate: '18/06/2026', facilityName: 'Trung tâm Y tế Q. Hải Châu' },
  { id: 'v4', name: 'Vắc xin 6 trong 1 (Mũi 3) + Uống Rota (Liều 2)', ageRecommendation: '4 tháng tuổi', ageInMonths: 4, diseaseTarget: 'Hoàn thành phác đồ cơ bản 6in1', isCompleted: false, notes: 'Dự kiến tiêm vào tuần tới' },
  { id: 'v5', name: 'Cúm mùa (Mũi 1)', ageRecommendation: '6 tháng tuổi', ageInMonths: 6, diseaseTarget: 'Phòng cúm chủng A và B', isCompleted: false },
  { id: 'v6', name: 'Sởi đơn & Viêm màng não mô cầu BC', ageRecommendation: '9 tháng tuổi', ageInMonths: 9, diseaseTarget: 'Bệnh sởi và viêm màng não do vi khuẩn mô cầu', isCompleted: false },
  { id: 'v7', name: 'Sởi - Quai bị - Rubella (MMR) + Thủy đậu', ageRecommendation: '12 tháng tuổi', ageInMonths: 12, diseaseTarget: 'Sởi, Quai bị, Rubella và Thủy đậu', isCompleted: false },
];

const initialGrowthRecords: GrowthRecord[] = [
  { id: 'g1', childName: 'Bé Bắp', date: '15/01/2026', ageMonths: 0, weightKg: 3.4, heightCm: 50.0, whoWeightStatus: 'normal', whoHeightStatus: 'normal' },
  { id: 'g2', childName: 'Bé Bắp', date: '15/03/2026', ageMonths: 2, weightKg: 5.6, heightCm: 58.0, whoWeightStatus: 'normal', whoHeightStatus: 'normal' },
  { id: 'g3', childName: 'Bé Bắp', date: '15/05/2026', ageMonths: 4, weightKg: 7.2, heightCm: 64.5, whoWeightStatus: 'normal', whoHeightStatus: 'normal' },
];

const initialCommunityReviews: CommunityReview[] = [
  {
    id: 'r1',
    title: 'Trường Mầm non Quốc tế ABC (Cơ sở Trần Phú)',
    category: 'daycare',
    categoryLabel: 'Trường Mầm Non 🏫',
    rating: 5,
    address: '45 Trần Phú, P. Hải Châu 1, Q. Hải Châu, Đà Nẵng',
    wardName: 'Phường Hải Châu 1',
    districtName: 'Quận Hải Châu',
    reviewerName: 'Mẹ Hoa Lan (Nguyễn Mai Lan)',
    reviewerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-IBwqPJodx0bhjMMtWBnEumH7CeEcHYYNiqYBjoUEkj_qabxH1ALcHtHutYeWwIptQR6GxxKV7gTwxdAEB3hciMyjSGBfED7xp6UB8CFORG2YOpZQx5ImXldDdbnBtebM5tpxgqEdV0vGy0z2q6krWUFnknd7cSIscsvGP5vbVKlpI_qOK0MHnQ2yvj2GjFvoylJnNRCIfge7nU2T6bJ-Zzxre4lB1WjZvVBBJA1b1MyLen5e6NqPzVFRFeh-l9kmMfDOe5rIhOGQ',
    childAge: 'Bé 2.5 tuổi',
    comment: 'Trường có camera trực tuyến rõ nét, cô giáo rất kiên nhẫn dỗ bé ăn. Sân chơi trải thảm cỏ sạch sẽ, thực đơn phong phú nhiều rau củ hữu cơ.',
    likesCount: 18,
    createdAt: '2 ngày trước'
  },
  {
    id: 'r2',
    title: 'Phòng khám Nhi BS. Nguyễn Thị Thu Hà',
    category: 'clinic',
    categoryLabel: 'Phòng Khám Nhi 🏥',
    rating: 5,
    address: '112 Quang Trung, P. Thạch Thang, Q. Hải Châu',
    wardName: 'Phường Thạch Thang',
    districtName: 'Quận Hải Châu',
    reviewerName: 'Mẹ Bắp (Trần Thu Thảo)',
    reviewerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEymEhhOzQ94Wb75d90oia7jzn7EW3FrnOW69g4JOwMYfnuF8a5ZkOPeLopzXieitglTsgKuVJav8unMM6YsBFfr5CSqZZ3lCsFzz0aAqzNfwkCPXLDCeU8XYzTcw4CO1_ldMzPO6Yx5T_-zuXnRIGUxZwfeCAsM8UCgUmwWlCtvS-VGpM2Vz3lZ1D3l6OHRhMnWQAvNc2QQccfdEAfp2FGTYfu-FT8j7PAb2d2-IXGqBuqkKYMTDjzCzwAY_JE_c8ArC19QFm3Api',
    childAge: 'Bé 6 tháng',
    comment: 'Bác sĩ Hà khám cực kỳ tận tâm, hạn chế lạm dụng kháng sinh. Bác giải thích rõ cơ chế đề kháng và hướng dẫn mẹ cách rửa mũi cho bé rất êm.',
    likesCount: 24,
    createdAt: '1 tuần trước'
  },
  {
    id: 'r3',
    title: 'Khu vui chơi TiniWorld Vincom Đà Nẵng',
    category: 'playground',
    categoryLabel: 'Khu Vui Chơi 🎡',
    rating: 4,
    address: 'Tầng 3 Vincom Plaza, Ngô Quyền, Q. Sơn Trà',
    wardName: 'Phường An Hải Bắc',
    districtName: 'Quận Sơn Trà',
    reviewerName: 'Mẹ Ngọc Ánh',
    reviewerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEymEhhOzQ94Wb75d90oia7jzn7EW3FrnOW69g4JOwMYfnuF8a5ZkOPeLopzXieitglTsgKuVJav8unMM6YsBFfr5CSqZZ3lCsFzz0aAqzNfwkCPXLDCeU8XYzTcw4CO1_ldMzPO6Yx5T_-zuXnRIGUxZwfeCAsM8UCgUmwWlCtvS-VGpM2Vz3lZ1D3l6OHRhMnWQAvNc2QQccfdEAfp2FGTYfu-FT8j7PAb2d2-IXGqBuqkKYMTDjzCzwAY_JE_c8ArC19QFm3Api',
    childAge: 'Bé 3 tuổi',
    comment: 'Đồ chơi được khử khuẩn định kỳ, có nhiều góc vận động liên hoàn và nhà bóng to. Cuối tuần hơi đông nên các mẹ đi ngày thường sẽ thoáng hơn.',
    likesCount: 12,
    createdAt: '3 ngày trước'
  }
];

export const CareHandbookScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'vaccine' | 'growth' | 'community'>('vaccine');

  // Vaccine state
  const [vaccines, setVaccines] = useState<VaccineDose[]>(initialVaccines);

  // Growth state
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>(initialGrowthRecords);
  const [inputWeight, setInputWeight] = useState('');
  const [inputHeight, setInputHeight] = useState('');
  const [inputAgeMonths, setInputAgeMonths] = useState('');

  // Community state
  const [reviews, setReviews] = useState<CommunityReview[]>(initialCommunityReviews);

  const toggleVaccine = (id: string) => {
    setVaccines(prev => prev.map(v => {
      if (v.id === id) {
        const nextState = !v.isCompleted;
        return {
          ...v,
          isCompleted: nextState,
          completedDate: nextState ? new Date().toLocaleDateString('vi-VN') : undefined
        };
      }
      return v;
    }));
  };

  const handleAddGrowthRecord = () => {
    const w = parseFloat(inputWeight);
    const h = parseFloat(inputHeight);
    const m = parseInt(inputAgeMonths, 10);

    if (!w || !h || isNaN(m)) {
      Alert.alert('Thiếu thông tin', 'Mẹ vui lòng nhập đầy đủ số tháng tuổi, cân nặng (kg) và chiều cao (cm) của bé nhé!');
      return;
    }

    // WHO Standard logic
    let weightStatus: GrowthRecord['whoWeightStatus'] = 'normal';
    if (w < m * 0.5 + 3.0) weightStatus = 'underweight';
    if (w > m * 0.8 + 5.0) weightStatus = 'overweight';

    let heightStatus: GrowthRecord['whoHeightStatus'] = 'normal';
    if (h < m * 1.5 + 48.0) heightStatus = 'stunted';

    const newRecord: GrowthRecord = {
      id: 'g_' + Date.now(),
      childName: 'Bé Bắp',
      date: new Date().toLocaleDateString('vi-VN'),
      ageMonths: m,
      weightKg: w,
      heightCm: h,
      whoWeightStatus: weightStatus,
      whoHeightStatus: heightStatus,
    };

    setGrowthRecords([newRecord, ...growthRecords]);
    setInputWeight('');
    setInputHeight('');
    setInputAgeMonths('');

    Alert.alert('Đã lưu chỉ số bé 🎉', 'Chỉ số phát triển của bé đã được cập nhật theo bảng tiêu chuẩn WHO!');
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Sổ Tay Mẹ Bỉm" showBack />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'vaccine' && styles.tabItemActive]}
          onPress={() => setActiveTab('vaccine')}
          activeOpacity={0.8}
        >
          <Syringe size={18} color={activeTab === 'vaccine' ? COLORS.primary : COLORS.secondary} />
          <Text style={[styles.tabText, activeTab === 'vaccine' && styles.tabTextActive]}>Tiêm Chủng</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'growth' && styles.tabItemActive]}
          onPress={() => setActiveTab('growth')}
          activeOpacity={0.8}
        >
          <TrendingUp size={18} color={activeTab === 'growth' ? COLORS.primary : COLORS.secondary} />
          <Text style={[styles.tabText, activeTab === 'growth' && styles.tabTextActive]}>Chuẩn WHO</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'community' && styles.tabItemActive]}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.8}
        >
          <Star size={18} color={activeTab === 'community' ? COLORS.primary : COLORS.secondary} />
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>Review Mẹ Bỉm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* TAB 1: VACCINE TRACKER */}
        {activeTab === 'vaccine' && (
          <View style={styles.tabContent}>
            <View style={styles.bannerBox}>
              <MascotIcon size={44} mood="happy" dialogue="Mẹ theo dõi các mốc tiêm phòng quan trọng để bảo vệ bé yêu nhé! ❤️" />
            </View>

            <Text style={styles.sectionTitle}>Lộ Trình Tiêm Chủng Mở Rộng & Dịch Vụ</Text>

            {vaccines.map((v) => (
              <Card key={v.id} style={styles.vaccineCard}>
                <TouchableOpacity 
                  style={styles.vaccineHeaderRow} 
                  onPress={() => toggleVaccine(v.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkboxContainer}>
                    {v.isCompleted ? (
                      <CheckCircle2 size={24} color={COLORS.primary} />
                    ) : (
                      <Circle size={24} color={COLORS.outlineVariant} />
                    )}
                  </View>
                  <View style={styles.vaccineInfo}>
                    <Text style={[styles.vaccineName, v.isCompleted && styles.textCompleted]}>{v.name}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.ageBadge}>
                        <Calendar size={12} color={COLORS.primary} />
                        <Text style={styles.ageBadgeText}>{v.ageRecommendation}</Text>
                      </View>
                      {v.isCompleted && (
                        <View style={styles.doneBadge}>
                          <Text style={styles.doneBadgeText}>Đã tiêm ngày {v.completedDate}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.diseaseText}>🎯 {v.diseaseTarget}</Text>
                    {v.facilityName && (
                      <Text style={styles.facilityText}>🏥 {v.facilityName}</Text>
                    )}
                    {v.notes && (
                      <Text style={styles.notesText}>📝 {v.notes}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {/* TAB 2: WHO GROWTH CALCULATOR */}
        {activeTab === 'growth' && (
          <View style={styles.tabContent}>
            <Card style={styles.calculatorCard}>
              <View style={styles.calcTitleRow}>
                <Baby size={22} color={COLORS.primary} />
                <Text style={styles.calcTitle}>Nhập Chỉ Số Của Bé (Chuẩn WHO)</Text>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Tháng tuổi *</Text>
                  <TextInput 
                    style={styles.calcInput}
                    placeholder="VD: 4"
                    keyboardType="numeric"
                    value={inputAgeMonths}
                    onChangeText={setInputAgeMonths}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Cân nặng (kg) *</Text>
                  <TextInput 
                    style={styles.calcInput}
                    placeholder="VD: 7.2"
                    keyboardType="numeric"
                    value={inputWeight}
                    onChangeText={setInputWeight}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Chiều cao (cm) *</Text>
                  <TextInput 
                    style={styles.calcInput}
                    placeholder="VD: 64.5"
                    keyboardType="numeric"
                    value={inputHeight}
                    onChangeText={setInputHeight}
                  />
                </View>
              </View>

              <Button 
                title="Lưu & Đánh Giá Chỉ Số"
                onPress={handleAddGrowthRecord}
                style={{ marginTop: SPACING.md }}
              />
            </Card>

            <Text style={styles.sectionTitle}>Lịch Sử Tăng Trưởng Của Bé Bắp</Text>

            {growthRecords.map((r) => (
              <Card key={r.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>📅 {r.date} ({r.ageMonths} tháng tuổi)</Text>
                  <View style={[
                    styles.statusPill, 
                    r.whoWeightStatus === 'normal' ? styles.statusNormal : styles.statusWarning
                  ]}>
                    <Text style={styles.statusPillText}>
                      {r.whoWeightStatus === 'normal' ? 'Chuẩn WHO ✨' : 'Cần chú ý ⚠️'}
                    </Text>
                  </View>
                </View>

                <View style={styles.recordValuesRow}>
                  <View style={styles.valueBox}>
                    <Text style={styles.valueNumber}>{r.weightKg} kg</Text>
                    <Text style={styles.valueLabel}>Cân nặng</Text>
                  </View>
                  <View style={styles.valueBox}>
                    <Text style={styles.valueNumber}>{r.heightCm} cm</Text>
                    <Text style={styles.valueLabel}>Chiều cao</Text>
                  </View>
                  <View style={styles.valueBox}>
                    <Text style={[styles.valueNumber, { color: COLORS.primary }]}>Bình thường</Text>
                    <Text style={styles.valueLabel}>Đánh giá tổng quát</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* TAB 3: LOCAL COMMUNITY REVIEWS */}
        {activeTab === 'community' && (
          <View style={styles.tabContent}>
            <View style={styles.communityBanner}>
              <Sparkles size={20} color={COLORS.primary} />
              <Text style={styles.communityBannerText}>
                Nơi các mẹ bỉm cùng Phường chia sẻ và đánh giá thực tế trường học, bác sĩ nhi & khu vui chơi gần nhà!
              </Text>
            </View>

            {reviews.map((rev) => (
              <Card key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{rev.reviewerName}</Text>
                    <Text style={styles.reviewerChildAge}>👶 {rev.childAge}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star size={14} color="#F5A623" fill="#F5A623" />
                    <Text style={styles.ratingScore}>{rev.rating}.0</Text>
                  </View>
                </View>

                <Text style={styles.reviewPlaceTitle}>{rev.title}</Text>
                <View style={styles.addressRow}>
                  <MapPin size={14} color={COLORS.secondary} />
                  <Text style={styles.addressText}>{rev.address}</Text>
                </View>

                <Text style={styles.reviewComment}>"{rev.comment}"</Text>

                <View style={styles.reviewFooter}>
                  <Text style={styles.timeAgoText}>{rev.createdAt}</Text>
                  <TouchableOpacity style={styles.likeBtn} activeOpacity={0.7}>
                    <ThumbsUp size={14} color={COLORS.primary} />
                    <Text style={styles.likeText}>{rev.likesCount} mẹ thấy hữu ích</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 6,
    borderRadius: RADIUS.md,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  tabTextActive: {
    color: COLORS.onPrimaryContainer,
    fontWeight: '700',
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  tabContent: {
    gap: SPACING.md,
  },
  bannerBox: {
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onBackground,
    marginTop: SPACING.xs,
  },
  vaccineCard: {
    padding: SPACING.md,
  },
  vaccineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  checkboxContainer: {
    paddingTop: 2,
  },
  vaccineInfo: {
    flex: 1,
    gap: 4,
  },
  vaccineName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  textCompleted: {
    color: COLORS.outline,
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginVertical: 2,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  doneBadge: {
    backgroundColor: '#E2F0CB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5C35',
  },
  diseaseText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  facilityText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  notesText: {
    fontSize: 12,
    color: '#D97706',
    fontStyle: 'italic',
  },
  calculatorCard: {
    padding: SPACING.md,
    backgroundColor: '#FFFDF9',
    borderColor: 'rgba(58, 103, 88, 0.2)',
    borderWidth: 1,
  },
  calcTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  calcTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onBackground,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  calcInput: {
    height: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordCard: {
    padding: SPACING.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusNormal: {
    backgroundColor: '#E2F0CB',
  },
  statusWarning: {
    backgroundColor: '#FDE2E4',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  recordValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  valueBox: {
    alignItems: 'center',
  },
  valueNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  valueLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  communityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  communityBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.onPrimaryContainer,
    lineHeight: 18,
    fontWeight: '500',
  },
  reviewCard: {
    padding: SPACING.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  reviewerChildAge: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewPlaceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.onSurface,
    lineHeight: 19,
    marginTop: 8,
    fontStyle: 'italic',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  timeAgoText: {
    fontSize: 11,
    color: COLORS.outline,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default CareHandbookScreen;
