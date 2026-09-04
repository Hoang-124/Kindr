// src/features/profile/screens/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Check,
  Sparkles,
  Info,
  X,
  FileText,
} from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { ScalePressable } from '../../../components/common/ScalePressable';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { useAuth } from '../../../app/providers/AuthProvider';
import { uploadImageToCloud } from '../../../services/uploadService';
import { VIETNAM_LOCATIONS, District, Ward } from '../../../utils/locations';

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { currentUser, updateProfile } = useAuth();

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState((currentUser as any)?.bio || '');
  const [avatarUri, setAvatarUri] = useState(currentUser?.avatar || '');

  // Location states
  const initialDistrictId = currentUser?.location?.districtId || 'dn_haichau';
  const initialDistrict = VIETNAM_LOCATIONS.find((d) => d.id === initialDistrictId) || VIETNAM_LOCATIONS[0];
  const [selectedDistrict, setSelectedDistrict] = useState<District>(initialDistrict);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [addressDetail, setAddressDetail] = useState(currentUser?.location?.addressDetail || '');

  // UI state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);

  // Errors
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Handle Pick Image
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Kindr cần quyền truy cập thư viện ảnh để mẹ chọn ảnh đại diện.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setAvatarUri(localUri);

        // Upload to Cloudinary CDN
        setIsUploadingAvatar(true);
        const cloudUrl = await uploadImageToCloud(localUri, 'kindr/avatars');
        setAvatarUri(cloudUrl);
        setIsUploadingAvatar(false);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      setIsUploadingAvatar(false);
      Alert.alert('Lỗi tải ảnh', 'Không thể tải ảnh đại diện lên máy chủ. Vui lòng thử lại.');
    }
  };

  // Handle Take Photo
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền camera', 'Kindr cần quyền mở máy ảnh để chụp ảnh đại diện.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setAvatarUri(localUri);

        setIsUploadingAvatar(true);
        const cloudUrl = await uploadImageToCloud(localUri, 'kindr/avatars');
        setAvatarUri(cloudUrl);
        setIsUploadingAvatar(false);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setIsUploadingAvatar(false);
      Alert.alert('Lỗi máy ảnh', 'Không thể mở máy ảnh. Vui lòng thử lại.');
    }
  };

  const showAvatarPickerOptions = () => {
    Alert.alert('Đổi ảnh đại diện', 'Mẹ muốn chọn ảnh từ đâu?', [
      { text: 'Chụp ảnh mới', onPress: handleTakePhoto },
      { text: 'Chọn từ thư viện', onPress: handlePickImage },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  // Validate inputs
  const validate = () => {
    let isValid = true;
    setNameError('');
    setPhoneError('');

    if (!name.trim() || name.trim().length < 2) {
      setNameError('Họ và tên phải có ít nhất 2 ký tự');
      isValid = false;
    }

    if (phone.trim()) {
      const vnPhoneRegex = /^0\d{9}$/;
      if (!vnPhoneRegex.test(phone.trim())) {
        setPhoneError('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 (VD: 0905123456)');
        isValid = false;
      }
    }

    return isValid;
  };

  // Save changes
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const districtName = selectedDistrict.name;

      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatarUri,
        bio: bio.trim(),
        districtId: selectedDistrict.id,
        districtName: districtName,
        addressDetail: addressDetail.trim(),
      });

      setIsSubmitting(false);
      Alert.alert('Thành công 🎉', 'Thông tin cá nhân của mẹ đã được cập nhật an toàn.', [
        { text: 'Đồng ý', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      setIsSubmitting(false);
      Alert.alert('Không thể lưu', error || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.');
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Chỉnh sửa hồ sơ" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUri && avatarUri.startsWith('http') ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {(name || 'M')[0].toUpperCase()}
                  </Text>
                </View>
              )}

              {isUploadingAvatar && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.uploadingText}>Đang tải...</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.8}
                onPress={showAvatarPickerOptions}
                disabled={isUploadingAvatar}
              >
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={showAvatarPickerOptions}
              disabled={isUploadingAvatar}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Họ và tên */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Họ và tên <Text style={{ color: COLORS.error }}>*</Text>
              </Text>
              <Input
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                placeholder="VD: Mẹ Thảo Vy"
                icon={<UserIcon size={18} color={COLORS.textMuted} />}
                error={nameError}
              />
            </View>

            {/* Số điện thoại */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Số điện thoại liên hệ
              </Text>
              <Input
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (phoneError) setPhoneError('');
                }}
                placeholder="VD: 0905123456"
                keyboardType="phone-pad"
                icon={<Phone size={18} color={COLORS.textMuted} />}
                error={phoneError}
              />
              <Text style={styles.helperText}>
                Số điện thoại chỉ hiển thị cho đối tác sau khi bàn giao để hai mẹ gọi điện/nhắn tin.
              </Text>
            </View>

            {/* Email (Read only if from Google) */}
            {currentUser?.email && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Địa chỉ Email</Text>
                <View style={styles.readOnlyInput}>
                  <Mail size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                  <Text style={styles.readOnlyText}>{currentUser.email}</Text>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>Đã xác thực</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Khu vực sinh sống */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Quận / Huyện sinh sống</Text>
              <ScalePressable
                style={styles.pickerSelector}
                scaleTo={0.98}
                onPress={() => setShowDistrictModal(true)}
              >
                <MapPin size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.pickerSelectorText}>
                  {selectedDistrict ? `${selectedDistrict.name} (${selectedDistrict.city})` : 'Chọn quận / huyện'}
                </Text>
                <ChevronDown size={18} color={COLORS.textMuted} />
              </ScalePressable>
            </View>

            {/* Phường / Xã */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phường / Xã (Tùy chọn)</Text>
              <ScalePressable
                style={styles.pickerSelector}
                scaleTo={0.98}
                onPress={() => setShowWardModal(true)}
              >
                <MapPin size={18} color={COLORS.secondary} style={{ marginRight: 8 }} />
                <Text style={styles.pickerSelectorText}>
                  {selectedWard ? selectedWard.name : 'Chọn phường / xã'}
                </Text>
                <ChevronDown size={18} color={COLORS.textMuted} />
              </ScalePressable>
            </View>

            {/* Địa chỉ chi tiết */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Địa chỉ chi tiết (Số nhà, tên đường)</Text>
              <Input
                value={addressDetail}
                onChangeText={setAddressDetail}
                placeholder="VD: Số 45 Trần Phú"
                icon={<MapPin size={18} color={COLORS.textMuted} />}
              />
            </View>

            {/* Giới thiệu ngắn về mẹ & bé */}
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.fieldLabel}>Giới thiệu về mẹ & bé</Text>
                <Text style={styles.charCounter}>{bio.length}/250</Text>
              </View>
              <Input
                value={bio}
                onChangeText={(text) => {
                  if (text.length <= 250) setBio(text);
                }}
                placeholder="VD: Mẹ bé Bon 18 tháng, thích trao đổi đồ chơi thông minh và truyện tranh Ehon..."
                multiline
                numberOfLines={3}
                style={styles.bioInput}
              />
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Sparkles size={18} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.infoBannerText}>
              Cập nhật đầy đủ địa chỉ và số điện thoại giúp tăng <Text style={{ fontWeight: '800' }}>Điểm Văn Minh</Text> và tỷ lệ ghép đôi trao đổi đồ thành công thêm 60%!
            </Text>
          </View>

          {/* Save Button */}
          <View style={styles.actionContainer}>
            <Button
              title={isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              onPress={handleSave}
              disabled={isSubmitting || isUploadingAvatar}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* District Selection Modal */}
      <Modal visible={showDistrictModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Quận / Huyện</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)} style={styles.closeBtn}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={VIETNAM_LOCATIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedDistrict?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => {
                      setSelectedDistrict(item);
                      setSelectedWard(null); // Reset ward
                      setShowDistrictModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                      {item.name} - {item.city}
                    </Text>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Ward Selection Modal */}
      <Modal visible={showWardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Phường / Xã ({selectedDistrict?.name})</Text>
              <TouchableOpacity onPress={() => setShowWardModal(false)} style={styles.closeBtn}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedDistrict?.wards || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedWard?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => {
                      setSelectedWard(item);
                      setShowWardModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                      {item.name}
                    </Text>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarFallbackText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.soft,
  },
  changeAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.card,
    marginBottom: SPACING.md,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  charCounter: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bioInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: RADIUS.default,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  readOnlyText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  verifiedTag: {
    backgroundColor: '#E6F9F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  pickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.default,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.2,
    borderColor: COLORS.outline,
    ...SHADOWS.soft,
  },
  pickerSelectorText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF4E6',
    borderRadius: RADIUS.default,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: SPACING.lg,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#8C4A00',
    lineHeight: 18,
    flex: 1,
  },
  actionContainer: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 6,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalOptionActive: {
    backgroundColor: '#FFF5F5',
    borderRadius: RADIUS.sm,
  },
  modalOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  modalOptionTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
});

export default EditProfileScreen;
