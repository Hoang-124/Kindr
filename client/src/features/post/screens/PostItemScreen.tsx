// src/features/post/screens/PostItemScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { addProduct, createProductAsync } from '../../home/store/homeSlice';
import { updateUserFrozenXu, refreshWalletBalance } from '../../auth/store/authSlice';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import FormSelect from '../../../components/form/FormSelect';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import MascotIcon from '../../../components/common/MascotIcon';
import { Image as ImageIcon, Sparkles, X, Lightbulb, MapPin, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { DEFAULT_IMAGES } from '../../../utils/constants';
import { 
  getSuggestedXu, 
  calculateSafeFee, 
  getConditionLabel, 
  getSmartPricingNudge,
  CategoryType, 
  ConditionType 
} from '../../../utils/pricing';
import { VIETNAM_LOCATIONS, getWardsByDistrictId } from '../../../utils/locations';

export const PostItemScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('toy_small');
  const [condition, setCondition] = useState<ConditionType>('90');
  const [ageRange, setAgeRange] = useState('1-3y');
  const [xuPrice, setXuPrice] = useState('4');
  const [selectedDistrictId, setSelectedDistrictId] = useState('dn_haichau');
  const [selectedWardId, setSelectedWardId] = useState('hc_thachthang');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Category and Condition Options
  const categoryOptions = [
    { value: 'toy_small', label: 'Đồ chơi nhỏ 🧸' },
    { value: 'toy_large', label: 'Đồ chơi lớn 🚲' },
    { value: 'book', label: 'Sách truyện 📚' },
    { value: 'quan_ao', label: 'Quần áo bé 👶' },
    { value: 'xe_noi', label: 'Xe đẩy & Nôi cũi 🚼' },
    { value: 'do_hoc_tap', label: 'Đồ học tập ✏️' },
    { value: 'charity', label: 'Trạm Tặng Đồ 🎁 (0 Xu)' },
  ];

  const conditionOptions = [
    { value: '90', label: 'Mới 90% (Rất mới, ít dùng)' },
    { value: '80', label: 'Mới 80% (Khá mới, dùng tốt)' },
    { value: '70', label: 'Mới 70% (Đã dùng nhiều, nguyên vẹn)' },
  ];

  const ageOptions = [
    { value: '0-6m', label: '0 - 6 tháng' },
    { value: '6-12m', label: '6 - 12 tháng' },
    { value: '1-3y', label: '1 - 3 tuổi' },
    { value: '3+', label: 'Trên 3 tuổi' },
  ];

  // District options
  const districtOptions = VIETNAM_LOCATIONS.map(d => ({
    value: d.id,
    label: `${d.name} (${d.city})`
  }));

  // Ward options based on selected district
  const wardOptions = getWardsByDistrictId(selectedDistrictId).map(w => ({
    value: w.id,
    label: w.name
  }));

  // Auto Price calculation whenever category or condition changes
  useEffect(() => {
    if (category === 'charity') {
      setXuPrice('0');
    } else {
      const suggested = getSuggestedXu(category, condition);
      setXuPrice(suggested.toString());
    }
  }, [category, condition]);

  // Update wards when district changes
  useEffect(() => {
    const wards = getWardsByDistrictId(selectedDistrictId);
    if (wards.length > 0) {
      setSelectedWardId(wards[0].id);
    }
  }, [selectedDistrictId]);

  const handlePickImage = async () => {
    Alert.alert(
      'Chọn hình ảnh món đồ 📸',
      'Mẹ muốn chụp ảnh mới hay chọn từ bộ sưu tập ảnh trên máy?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chụp ảnh mới',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền truy cập', 'Kindr cần quyền truy cập camera để chụp ảnh món đồ.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setImageUri(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Chọn từ thư viện',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền truy cập', 'Kindr cần quyền truy cập thư viện ảnh để chọn ảnh món đồ.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setImageUri(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const priceNum = parseInt(xuPrice || '0', 10);
  const safeFee = calculateSafeFee(priceNum);
  const pricingNudge = getSmartPricingNudge(category, condition);

  const handlePost = async () => {
    if (!name.trim() || !category || !condition || !description.trim()) {
      setError('Vui lòng điền đầy đủ tất cả các trường có dấu *.');
      return;
    }

    if (!currentUser) return;

    if (category !== 'charity' && safeFee > currentUser.xuBalance) {
      setError(`Mẹ ơi, số dư ví hiện có ${currentUser.xuBalance} Xu không đủ ký quỹ ${safeFee} Xu Safe Fee (10%). Hãy nạp thêm Xu nhé!`);
      return;
    }

    setLoading(true);
    setError('');

    const conditionLabel = getConditionLabel(condition);
    const districtObj = VIETNAM_LOCATIONS.find(d => d.id === selectedDistrictId);
    const wardObj = districtObj?.wards.find(w => w.id === selectedWardId);
    const fullLocationName = `${wardObj?.name || 'Phường Thạch Thang'}, ${districtObj?.name || 'Quận Hải Châu'}, ${districtObj?.city || 'Đà Nẵng'}`;
    const finalImage = imageUri || DEFAULT_IMAGES.PRODUCT_FALLBACK;

    try {
      // 1. Call real API
      await dispatch(createProductAsync({
        name: name.trim(),
        price: priceNum,
        condition: condition as '70' | '80' | '90',
        conditionLabel,
        category,
        ageRange: ageRange || undefined,
        locationName: fullLocationName,
        wardId: selectedWardId,
        districtId: selectedDistrictId,
        image: finalImage,
        description: description.trim(),
      })).unwrap();

      dispatch(refreshWalletBalance());
      setLoading(false);

      const msg = category === 'charity'
        ? `Món đồ "${name}" của mẹ đã được đăng lên Trạm Tặng Đồ (0 Xu) cho gia đình cần nhận ❤️`
        : `Món đồ "${name}" của mẹ đã được duyệt đăng lên sàn! Hệ thống tạm khóa ${safeFee} Xu Safe Fee bảo chứng chất lượng.`;

      Alert.alert('Đăng đồ thành công 🎉', msg, [
        {
          text: 'Đồng ý',
          onPress: () => {
            setName('');
            setDescription('');
            setImageUri('');
            navigation.navigate('Home');
          }
        }
      ]);
    } catch (err: any) {
      // 2. Fallback to local dispatch
      const newProduct = {
        id: 'prod_' + Math.random().toString(36).substring(2, 9),
        name,
        price: priceNum,
        condition,
        conditionLabel,
        category,
        ageRange: ageRange || undefined,
        distance: '0.2 km',
        locationName: fullLocationName,
        wardId: selectedWardId,
        districtId: selectedDistrictId,
        timeAgo: 'Vừa xong',
        createdAt: new Date().toISOString(),
        image: finalImage,
        description,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerAvatar: currentUser.avatar,
        sellerPhone: currentUser.phone,
        sellerZalo: currentUser.phone,
        safeFeeLocked: safeFee,
        status: 'available' as const,
      };

      dispatch(addProduct(newProduct));

      if (safeFee > 0) {
        dispatch(updateUserFrozenXu({ userId: currentUser.id, amount: safeFee }));
      }

      setLoading(false);

      const msg = category === 'charity'
        ? `Món đồ "${name}" của mẹ đã được đăng lên Trạm Tặng Đồ (0 Xu) cho gia đình cần nhận ❤️`
        : `Món đồ "${name}" của mẹ đã được duyệt đăng lên sàn! Hệ thống tạm khóa ${safeFee} Xu Safe Fee bảo chứng chất lượng.`;

      Alert.alert('Đăng đồ thành công 🎉', msg, [
        {
          text: 'Đồng ý',
          onPress: () => {
            setName('');
            setDescription('');
            setImageUri('');
            navigation.navigate('Home');
          }
        }
      ]);
    }
  };

  return (
    <ScreenContainer scrollable>
      <Header title="Đăng đồ trao đổi" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mascot Dialogue Banner */}
        <View style={styles.mascotBanner}>
          <MascotIcon 
            size={52} 
            mood="protective" 
            dialogue={category === 'charity' 
              ? "Tặng đồ 0 Xu từ thiện được miễn hoàn toàn Safe Fee mẹ nhé! ❤️"
              : `Mẹ tạm gửi ${safeFee} Xu Safe Fee vào rương bảo vệ để đảm bảo đồ chất lượng nhé!`}
          />
        </View>

        <View style={styles.form}>
          <FormError message={error} />

          {/* Photo picker */}
          <Text style={styles.sectionLabel}>Hình ảnh thật món đồ *</Text>
          <View style={styles.photoContainer}>
            <TouchableOpacity 
              style={styles.addPhotoBtn}
              activeOpacity={0.8}
              onPress={handlePickImage}
            >
              <ImageIcon size={26} color={COLORS.primary} />
              <Text style={styles.addPhotoText}>Chụp / Chọn ảnh</Text>
            </TouchableOpacity>

            {imageUri ? (
              <View style={styles.photoPreviewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => setImageUri('')}>
                  <X size={14} color={COLORS.onSurface} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <ImageIcon size={24} color={COLORS.outlineVariant} />
              </View>
            )}
          </View>

          <Input
            label="Tên món đồ *"
            placeholder="VD: Xe chòi chân khủng long / Sách Ehon"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.rowFields}>
            <FormSelect
              label="Danh mục *"
              placeholder="Chọn danh mục"
              options={categoryOptions}
              selectedValue={category}
              onValueChange={(val) => setCategory(val as CategoryType)}
              containerStyle={{ flex: 1 }}
            />

            <FormSelect
              label="Tình trạng *"
              placeholder="Chọn độ mới"
              options={conditionOptions}
              selectedValue={condition}
              onValueChange={(val) => setCondition(val as ConditionType)}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <View style={styles.rowFields}>
            <FormSelect
              label="Độ tuổi phù hợp"
              placeholder="Chọn độ tuổi"
              options={ageOptions}
              selectedValue={ageRange}
              onValueChange={setAgeRange}
              containerStyle={{ flex: 1 }}
            />

            <View style={[styles.priceFieldContainer, { flex: 1 }]}>
              <Text style={styles.priceLabel}>Định giá (Xu) *</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceSymbol}>🪙</Text>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={xuPrice}
                  onChangeText={setXuPrice}
                  editable={category !== 'charity'}
                />
              </View>
            </View>
          </View>

          {/* Smart Pricing Nudge Box */}
          <View style={styles.nudgeBox}>
            <Lightbulb size={16} color="#D97706" style={{ marginTop: 2 }} />
            <Text style={styles.nudgeText}>{pricingNudge}</Text>
          </View>

          {/* Safe Fee Box Summary */}
          {category !== 'charity' && (
            <View style={styles.safeFeeBox}>
              <Sparkles size={16} color={COLORS.tertiary} />
              <Text style={styles.safeFeeText}>
                Tự động ký quỹ Phí Cam Kết 10%: <Text style={styles.safeFeeHighlight}>{safeFee} Xu</Text> (mở lại ví sau khi người mua nhận đồ 6 giờ).
              </Text>
            </View>
          )}

          {/* Location Dropdowns */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionLabel}>Vị trí trao đổi siêu cục bộ *</Text>
            <View style={styles.rowFields}>
              <FormSelect
                label="Quận / Huyện"
                options={districtOptions}
                selectedValue={selectedDistrictId}
                onValueChange={setSelectedDistrictId}
                containerStyle={{ flex: 1 }}
              />

              <FormSelect
                label="Phường / Xã"
                options={wardOptions}
                selectedValue={selectedWardId}
                onValueChange={setSelectedWardId}
                containerStyle={{ flex: 1 }}
              />
            </View>
          </View>

          <Input
            label="Mô tả món đồ *"
            placeholder="Mô tả kỹ tình trạng món đồ, nguồn gốc mua, bé đã dùng mấy tháng..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            inputStyle={styles.descriptionInput}
          />

          <Button
            title={category === 'charity' ? 'Tặng đồ ngay (0 Xu)' : `Đăng đồ ngay (Ký quỹ ${safeFee} Xu)`}
            onPress={handlePost}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
  mascotBanner: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  form: { width: '100%' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.onBackground, marginBottom: SPACING.xs },
  photoContainer: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  addPhotoBtn: {
    width: 85,
    height: 85,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryContainer,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  addPhotoText: { fontSize: 10, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  photoPreviewWrapper: { width: 85, height: 85, borderRadius: RADIUS.sm, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 85,
    height: 85,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowFields: { flexDirection: 'row', gap: SPACING.md },
  priceFieldContainer: { marginBottom: SPACING.md },
  priceLabel: { fontSize: 13, fontWeight: '600', color: COLORS.onBackground, marginBottom: SPACING.xs },
  priceInputWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.default,
    paddingHorizontal: SPACING.md,
  },
  priceSymbol: { fontSize: 16, marginRight: 6 },
  priceInput: { flex: 1, height: '100%', color: COLORS.onSurface, fontSize: 15, fontWeight: '700' },
  nudgeBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderColor: 'rgba(245, 166, 35, 0.3)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: 8,
    marginBottom: SPACING.md,
  },
  nudgeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  safeFeeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: 8,
    marginBottom: SPACING.md,
  },
  safeFeeText: { fontSize: 12, color: COLORS.onSurfaceVariant, flex: 1, lineHeight: 16 },
  safeFeeHighlight: { fontWeight: '700', color: COLORS.tertiary },
  locationSection: {
    marginBottom: SPACING.sm,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
});

export default PostItemScreen;
