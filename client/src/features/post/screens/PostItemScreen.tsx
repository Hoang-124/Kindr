import React, { useState, useEffect, useRef } from 'react';
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
import { addProduct, createProductAsync, fetchProducts } from '../../home/store/homeSlice';
import { updateUserFrozenXu, refreshWalletBalance } from '../../auth/store/authSlice';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import FormSelect from '../../../components/form/FormSelect';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import MascotIcon from '../../../components/common/MascotIcon';
import KindrCoin from '../../../components/common/KindrCoin';
import { Image as ImageIcon, Sparkles, X, Lightbulb, MapPin, Camera, Plus, ShieldCheck } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ImagePickerModal from '../../../components/common/ImagePickerModal';
import { DEFAULT_IMAGES } from '../../../utils/constants';
import { 
  getSuggestedXu, 
  calculateSafeFee, 
  getConditionLabel, 
  getSmartPricingNudge,
  getPriceBounds,
  CategoryType, 
  ConditionType 
} from '../../../utils/pricing';
import { VIETNAM_LOCATIONS, getWardsByDistrictId } from '../../../utils/locations';
import { generateAIAssistance } from '../../../services/aiService';
import { uploadImageToCloud } from '../../../services/uploadService';
import { ScalePressable } from '../../../components/common/ScalePressable';
import { PulseBadge } from '../../../components/common/PulseBadge';

export const PostItemScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const scrollViewRef = useRef<ScrollView>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('toy_small');
  const [condition, setCondition] = useState<ConditionType>('90');
  const [ageRange, setAgeRange] = useState('1-3y');
  const [xuPrice, setXuPrice] = useState('2');
  const [selectedDistrictId, setSelectedDistrictId] = useState('dn_haichau');
  const [selectedWardId, setSelectedWardId] = useState('hc_thachthang');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Category and Condition Options
  const categoryOptions = [
    { value: 'toy_small', label: 'Đồ chơi nhỏ' },
    { value: 'toy_large', label: 'Đồ chơi lớn' },
    { value: 'book', label: 'Sách truyện' },
    { value: 'quan_ao', label: 'Quần áo bé' },
    { value: 'xe_noi', label: 'Xe đẩy & Nôi cũi' },
    { value: 'do_hoc_tap', label: 'Đồ học tập' },
    { value: 'charity', label: 'Trạm Tặng Đồ (0 Xu)' },
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
      const b = getPriceBounds(category, condition);
      setXuPrice(b.suggested.toString());
    }
  }, [category, condition]);

  // Update wards when district changes
  useEffect(() => {
    const wards = getWardsByDistrictId(selectedDistrictId);
    if (wards.length > 0) {
      setSelectedWardId(wards[0].id);
    }
  }, [selectedDistrictId]);

  // Image picker modal state
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    isAdditional: boolean;
    title: string;
    subtitle: string;
  }>({
    visible: false,
    isAdditional: false,
    title: '',
    subtitle: '',
  });

  const handlePickImage = () => {
    setPickerModal({
      visible: true,
      isAdditional: false,
      title: 'Ảnh chính (Trực diện món đồ)',
      subtitle: 'Mẹ hãy chụp ảnh bao quát trực diện món đồ để bé đổi đồ ưng ý nhất.',
    });
  };

  const handlePickAdditionalImage = () => {
    if (additionalImages.length >= 2) {
      Alert.alert('Đã đủ góc ảnh', 'Mẹ có thể tải tối đa 3 ảnh (1 ảnh chính và 2 ảnh phụ chụp cận cảnh/vết xước).');
      return;
    }
    setPickerModal({
      visible: true,
      isAdditional: true,
      title: 'Thêm ảnh chi tiết / vết xước',
      subtitle: 'Chụp góc tem mác, độ mới hoặc chi tiết lỗi/hao mòn để đảm bảo độ tin cậy.',
    });
  };

  const executeCameraPick = async () => {
    try {
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
        if (pickerModal.isAdditional) {
          setAdditionalImages((prev) => [...prev, result.assets[0].uri]);
        } else {
          setImageUri(result.assets[0].uri);
        }
      }
    } catch (e) {
      console.warn('Camera pick error:', e);
    }
  };

  const executeLibraryPick = async () => {
    try {
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
        if (pickerModal.isAdditional) {
          setAdditionalImages((prev) => [...prev, result.assets[0].uri]);
        } else {
          setImageUri(result.assets[0].uri);
        }
      }
    } catch (e) {
      console.warn('Library pick error:', e);
    }
  };

  const handleRemoveAdditionalImage = (indexToRemove: number) => {
    setAdditionalImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const bounds = getPriceBounds(category, condition);
  const priceNum = parseInt(xuPrice || '0', 10);
  const safeFee = calculateSafeFee(priceNum);
  const pricingNudge = getSmartPricingNudge(category, condition);

  const handleAIAssist = async () => {
    if (!name.trim()) {
      Alert.alert(
        'Gợi ý từ AI',
        'Mẹ vui lòng nhập tên món đồ trước (VD: "Xe đẩy Combi", "Bộ xếp hình lego") để AI có thể phân tích và viết mô tả nhé!'
      );
      return;
    }

    setAiLoading(true);
    try {
      const result = await generateAIAssistance(name.trim(), category, condition);
      setCategory(result.category);
      setAgeRange(result.ageRange);
      if (category !== 'charity') {
        const b = getPriceBounds(result.category, condition);
        const clampedPrice = Math.min(Math.max(result.suggestedXu, b.min), b.max);
        setXuPrice(clampedPrice.toString());
      }
      setDescription(result.description);
      Alert.alert(
        'AI Đã Hoàn Tất',
        `Đã gợi ý mức giá ${result.suggestedXu} Xu và soạn sẵn nội dung mô tả chi tiết cho món "${name}"!`
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo gợi ý lúc này. Mẹ vui lòng tự nhập nhé.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePost = async () => {
    setError('');

    if (!currentUser) {
      Alert.alert('Chưa đăng nhập', 'Mẹ vui lòng đăng nhập tài khoản trước khi đăng đồ nhé!');
      return;
    }

    if (!name.trim()) {
      const msg = 'Mẹ ơi, vui lòng nhập Tên món đồ cần trao đổi nhé!';
      setError(msg);
      Alert.alert('Thiếu thông tin', msg);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (name.trim().length < 5) {
      const msg = 'Tên món đồ nên chi tiết một chút (tối thiểu 5 ký tự) để các mẹ khác dễ tìm kiếm nhé!';
      setError(msg);
      Alert.alert('Tên đồ dùng quá ngắn', msg);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (!description.trim()) {
      const msg = 'Mẹ ơi, vui lòng điền Mô tả món đồ để các mẹ khác yên tâm nhận đồ nhé!';
      setError(msg);
      Alert.alert('Thiếu thông tin', msg);
      return;
    }

    if (description.trim().length < 10) {
      const msg = 'Mô tả chi tiết cần tối thiểu 10 ký tự để đảm bảo độ tin cậy mẹ nhé!';
      setError(msg);
      Alert.alert('Mô tả quá ngắn', msg);
      return;
    }

    // Chống ngáo giá: Kiểm tra biên độ giá hợp lệ
    if (category !== 'charity') {
      if (isNaN(priceNum) || priceNum < bounds.min || priceNum > bounds.max) {
        const msg = bounds.min === bounds.max
          ? `Mẹ ơi, để chống chênh lệch giá, Kindr quy định mức cố định ${bounds.suggested} Xu cho món đồ này.`
          : `Mẹ ơi, để chống ngáo giá, Kindr giới hạn mức Xu cho món đồ này từ ${bounds.min} đến ${bounds.max} Xu (Giá gợi ý chuẩn: ${bounds.suggested} Xu).`;
        setError(msg);
        Alert.alert('Giá chưa phù hợp', msg);
        return;
      }
    }

    if (category !== 'charity' && safeFee > currentUser.xuBalance) {
      const msg = `Mẹ ơi, số dư ví hiện có ${currentUser.xuBalance} Xu không đủ ký quỹ ${safeFee} Xu Safe Fee (10%). Hãy nạp thêm Xu nhé!`;
      setError(msg);
      Alert.alert('Số dư ví không đủ', msg);
      return;
    }

    setLoading(true);
    setError('');

    const conditionLabel = getConditionLabel(condition);
    const districtObj = VIETNAM_LOCATIONS.find(d => d.id === selectedDistrictId);
    const wardObj = districtObj?.wards.find(w => w.id === selectedWardId);
    const fullLocationName = `${wardObj?.name || 'Phường Thạch Thang'}, ${districtObj?.name || 'Quận Hải Châu'}, ${districtObj?.city || 'Đà Nẵng'}`;
    
    let finalImage = DEFAULT_IMAGES.PRODUCT_FALLBACK;
    if (imageUri) {
      try {
        finalImage = await uploadImageToCloud(imageUri, 'kindr/products');
      } catch {
        finalImage = imageUri;
      }
    }

    const finalAdditionalImages: string[] = [];
    for (const uri of additionalImages) {
      try {
        const uploaded = await uploadImageToCloud(uri, 'kindr/products');
        finalAdditionalImages.push(uploaded);
      } catch {
        finalAdditionalImages.push(uri);
      }
    }

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
        additionalImages: finalAdditionalImages,
        description: description.trim(),
      })).unwrap();

      dispatch(fetchProducts());
      dispatch(refreshWalletBalance());
      setLoading(false);

      const feeExplanation = safeFee > 0
        ? `Hệ thống đã tạm giữ ${safeFee} Xu Safe Fee bảo chứng chất lượng (sẽ hoàn trả 100% khi giao dịch hoàn tất).`
        : '';

      const msg = `Món đồ "${name}" đã được đăng thành công và hiển thị trực tiếp trên sàn! ${feeExplanation}`;

      Alert.alert('Đăng đồ thành công', msg, [
        {
          text: 'Xem trên sàn',
          onPress: () => {
            setName('');
            setDescription('');
            setImageUri('');
            setAdditionalImages([]);
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
        additionalImages: finalAdditionalImages,
        description,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerAvatar: currentUser.avatar,
        sellerPhone: currentUser.phone,
        sellerZalo: currentUser.phone,
        safeFeeLocked: safeFee,
        status: 'available' as any,
      };

      dispatch(addProduct(newProduct));

      if (safeFee > 0) {
        dispatch(updateUserFrozenXu({ userId: currentUser.id, amount: safeFee }));
      }

      dispatch(fetchProducts());
      setLoading(false);

      const feeExplanation = safeFee > 0
        ? `Hệ thống đã tạm giữ ${safeFee} Xu Safe Fee bảo chứng chất lượng (sẽ hoàn trả 100% khi giao dịch hoàn tất).`
        : '';

      const fallbackMsg = `Món đồ "${name}" đã được đăng thành công và hiển thị trực tiếp trên sàn! ${feeExplanation}`;

      Alert.alert('Đăng đồ thành công', fallbackMsg, [
        {
          text: 'Xem trên sàn',
          onPress: () => {
            setName('');
            setDescription('');
            setImageUri('');
            setAdditionalImages([]);
            navigation.navigate('Home');
          }
        }
      ]);
    }
  };

  const getMascotDialogue = () => {
    if (category === 'charity') {
      return "Tặng đồ 0 Xu từ thiện được miễn hoàn toàn Safe Fee mẹ nhé!";
    }
    return `Mẹ tạm gửi ${safeFee} Xu Safe Fee vào rương bảo vệ để đảm bảo đồ sạch sẽ và đúng chất lượng nhé! (Sẽ hoàn trả 100% khi giao dịch hoàn tất)`;
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Đăng đồ trao đổi" />

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mascot Dialogue Banner */}
        <View style={styles.mascotBanner}>
          <MascotIcon 
            size={52} 
            mood={category === 'charity' ? 'celebrate' : 'protective'} 
            dialogue={getMascotDialogue()}
          />
        </View>

        <View style={styles.form}>
          <FormError message={error} />

          {/* Photo picker with multi-angle support */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs }}>
            <Text style={styles.sectionLabel}>Hình ảnh thực tế món đồ (Tối đa 3 góc) *</Text>
            <Text style={styles.photoCountText}>{1 + additionalImages.length}/3 ảnh</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoContainer}>
            {/* Primary Photo */}
            <View style={styles.photoSlot}>
              {imageUri ? (
                <View style={styles.photoPreviewWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => setImageUri('')}>
                    <X size={14} color={COLORS.onSurface} />
                  </TouchableOpacity>
                  <View style={styles.photoBadgePrimary}>
                    <Text style={styles.photoBadgeText}>Mặt chính</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addPhotoBtn}
                  activeOpacity={0.8}
                  onPress={handlePickImage}
                >
                  <Camera size={24} color={COLORS.primary} />
                  <Text style={styles.addPhotoText}>Ảnh trực diện *</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Additional Photos */}
            {additionalImages.map((uri, idx) => (
              <View key={`add_img_${idx}`} style={styles.photoSlot}>
                <View style={styles.photoPreviewWrapper}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => handleRemoveAdditionalImage(idx)}>
                    <X size={14} color={COLORS.onSurface} />
                  </TouchableOpacity>
                  <View style={styles.photoBadgeDetail}>
                    <Text style={styles.photoBadgeText}>{idx === 0 ? 'Chi tiết' : 'Góc xước'}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Add more button */}
            {imageUri && additionalImages.length < 2 && (
              <TouchableOpacity
                style={styles.addMorePhotoBtn}
                activeOpacity={0.8}
                onPress={handlePickAdditionalImage}
              >
                <Plus size={20} color={COLORS.primary} />
                <Text style={styles.addMorePhotoText}>Thêm góc</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <Input
            label="Tên món đồ *"
            placeholder="VD: Xe chòi chân khủng long / Sách Ehon"
            value={name}
            onChangeText={setName}
          />

          {/* AI Smart Assistant Action Button */}
          <ScalePressable
            style={styles.aiAssistBtn}
            scaleTo={0.96}
            onPress={handleAIAssist}
            disabled={aiLoading}
          >
            <Sparkles size={16} color={COLORS.primary} />
            <Text style={styles.aiAssistText}>
              {aiLoading ? 'AI đang phân tích & định giá...' : 'AI Gợi ý định giá & Viết mô tả'}
            </Text>
          </ScalePressable>

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
                <KindrCoin size={18} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={xuPrice}
                  onChangeText={setXuPrice}
                  editable={category !== 'charity'}
                />
              </View>
              {category !== 'charity' && (
                <Text style={styles.boundsHelperText}>
                  {bounds.min === bounds.max
                    ? `Khung quy định: Cố định ${bounds.suggested} Xu`
                    : `Khung quy định: ${bounds.min} - ${bounds.max} Xu (Chuẩn: ${bounds.suggested} Xu)`}
                </Text>
              )}
            </View>
          </View>

          {/* Smart Pricing Nudge Box */}
          <View style={styles.nudgeBox}>
            <Lightbulb size={16} color="#D97706" style={{ marginTop: 2 }} />
            <Text style={styles.nudgeText}>{pricingNudge}</Text>
          </View>

          {/* Safe Fee Box */}
          {category !== 'charity' && (
            <View style={styles.safeFeeBox}>
              <ShieldCheck size={16} color={COLORS.tertiary} />
              <Text style={styles.safeFeeText}>
                Tự động ký quỹ Phí Cam Kết 10%: <Text style={styles.safeFeeHighlight}>{safeFee} Xu</Text> (hoàn trả 100% về ví sau khi giao dịch hoàn tất).
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
            onChangeText={(text) => {
              setDescription(text);
              if (error) setError('');
            }}
            multiline
            numberOfLines={4}
            inputContainerStyle={styles.descInputContainer}
            inputStyle={styles.descriptionInput}
          />

          {error ? <FormError message={error} /> : null}

          <Button
            title={
              category === 'charity' 
                ? 'Tặng đồ ngay (0 Xu)' 
                : `Đăng đồ ngay (Ký quỹ ${safeFee} Xu Safe Fee)`
            }
            onPress={handlePost}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>

      <ImagePickerModal
        visible={pickerModal.visible}
        onClose={() => setPickerModal((prev) => ({ ...prev, visible: false }))}
        onSelectCamera={executeCameraPick}
        onSelectLibrary={executeLibraryPick}
        title={pickerModal.title}
        subtitle={pickerModal.subtitle}
      />
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
  aiAssistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: RADIUS.default,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: SPACING.md,
    marginTop: -4,
  },
  aiAssistText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
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
  photoCountText: { fontSize: 11, color: COLORS.outline, fontWeight: '500' },
  photoSlot: { marginRight: SPACING.sm },
  photoBadgePrimary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(91, 154, 139, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  photoBadgeDetail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61, 61, 61, 0.75)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  photoBadgeText: { fontSize: 9, color: '#FFF', fontWeight: '700' },
  addMorePhotoBtn: {
    width: 85,
    height: 85,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  addMorePhotoText: { fontSize: 10, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  boundsHelperText: { fontSize: 11, color: COLORS.primary, marginTop: 4, fontWeight: '600' },

  locationSection: {
    marginBottom: SPACING.sm,
  },
  descInputContainer: {
    minHeight: 110,
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  descriptionInput: {
    minHeight: 85,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 22,
  },
  submitBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
});

export default PostItemScreen;
