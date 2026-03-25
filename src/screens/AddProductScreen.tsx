import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  X,
  Shield,
  ShoppingBag,
  MessageSquare,
  Star,
  BadgeCheck,
  Check,
  MapPin,
  Navigation,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import * as db from '../lib/db';
import type { Category, Condition } from '../types';
import type { HomeStackParamList } from '../navigation/AppNavigator';

type AddProductNav = NativeStackNavigationProp<HomeStackParamList, 'AddProduct'>;

const categories: Category[] = [
  'Electronics',
  'Fashion',
  'Home & Living',
  'Sports & Outdoors',
  'Books & Media',
  'Furniture',
  'Toys & Games',
  'Beauty & Health',
  'Others',
];

const conditions: Condition[] = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export default function AddProductScreen() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Electronics');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<Condition>('Good');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [directDeal, setDirectDeal] = useState(true);
  const [parcelService, setParcelService] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigation = useNavigation<AddProductNav>();

  const fetchCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('product.add.location_permission_title') || 'Location Permission',
          t('product.add.location_permission_msg') || 'Please allow location access to auto-detect your location.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      if (geocode) {
        const parts = [geocode.district || geocode.subregion, geocode.city || geocode.region].filter(Boolean);
        setLocation(parts.join(', ') || `${geocode.city || geocode.region || 'Unknown'}`);
      }
    } catch {
      Alert.alert(
        t('product.add.location_error_title') || 'Location Error',
        t('product.add.location_error_msg') || 'Failed to detect location. Please enter manually.'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  // Block unverified users
  if (user && !user.verified) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <ArrowLeft size={22} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('nav.sell')}</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Unverified content */}
        <View style={styles.unverifiedContainer}>
          <View style={styles.unverifiedIcon}>
            <Shield size={40} color="#f59e0b" />
          </View>
          <Text style={styles.unverifiedTitle}>{t('verify.restriction_title')}</Text>
          <Text style={styles.unverifiedMessage}>{t('verify.unverified_sell')}</Text>

          <View style={styles.benefitsList}>
            {[
              { icon: <ShoppingBag size={18} color="#10b981" />, text: t('verify.benefit_sell') },
              { icon: <MessageSquare size={18} color="#10b981" />, text: t('verify.benefit_community') },
              { icon: <Star size={18} color="#10b981" />, text: t('verify.benefit_trust') },
              { icon: <BadgeCheck size={18} color="#10b981" />, text: t('verify.benefit_badge') },
            ].map((item, i) => (
              <View key={i} style={styles.benefitItem}>
                {item.icon}
                <Text style={styles.benefitText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.verifyButton}
            activeOpacity={0.8}
            onPress={() => {
              navigation.goBack();
              // Navigate to Profile tab's Verification screen
              (navigation as any).navigate('ProfileTab', { screen: 'Verification' });
            }}
          >
            <Text style={styles.verifyButtonText}>{t('verify.unverified_action')}</Text>
          </TouchableOpacity>
          <Text style={styles.browseText}>{t('verify.unverified_browse')}</Text>
        </View>
      </View>
    );
  }

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setIsSubmitting(true);
      try {
        const newImages: string[] = [];
        for (const asset of result.assets) {
          if (images.length + newImages.length >= 10) break;
          const url = await db.uploadImage(asset.uri);
          newImages.push(url);
        }
        setImages([...images, ...newImages]);
      } catch {
        showToast('Failed to upload image', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('product.add.camera_permission_title') || 'Camera Permission',
        t('product.add.camera_permission_msg') || 'Please allow camera access to take photos.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setIsSubmitting(true);
      try {
        const url = await db.uploadImage(result.assets[0].uri);
        setImages([...images, url]);
      } catch {
        showToast('Failed to upload image', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePublish = async () => {
    if (!user) return;
    if (!title || title.length < 5) {
      showToast('Title must be at least 5 characters', 'error');
      return;
    }
    if (!price || parseInt(price, 10) <= 0) {
      showToast('Price must be greater than 0', 'error');
      return;
    }
    if (!description || description.length < 10) {
      showToast('Description must be at least 10 characters', 'error');
      return;
    }
    if (!directDeal && !parcelService) {
      showToast('Please select at least one deal type', 'error');
      return;
    }

    setIsSubmitting(true);
    const dealTypes: string[] = [];
    if (directDeal) dealTypes.push('direct');
    if (parcelService) dealTypes.push('parcel');

    const finalImages =
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'];

    const product = {
      id: db.generateId(),
      sellerId: user.id,
      title,
      description,
      price: parseInt(price, 10),
      currency: 'KRW',
      category,
      condition,
      location: location || user.location || 'Seoul',
      images: finalImages,
      dealTypes,
      views: 0,
      likes: 0,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await db.createProductDoc(product);

      // System notification confirming listing
      await db.createNotification({
        id: db.generateId(),
        userId: user.id,
        type: 'system',
        title: t('notifications.product_listed_title') || 'Product Listed',
        body: `"${title}" ${t('notifications.product_listed_body') || 'has been successfully listed!'}`,
        relatedId: product.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      showToast(t('toast.product_published'));
      navigation.navigate('ProductDetail', { productId: product.id });
    } catch {
      showToast('Failed to publish product', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
          style={styles.headerBackButton}
        >
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('product.add.title')}</Text>
        <Text style={styles.stepIndicator}>{step}/3</Text>
      </View>

      {/* Step Progress */}
      <View style={styles.stepBar}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.stepSegment,
              { backgroundColor: s <= step ? '#10b981' : '#e2e8f0' },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Photos */}
        {step === 1 ? (
          <View>
            <Text style={styles.stepTitle}>{t('product.add.photo')}</Text>
            <View style={styles.imageGrid}>
              {images.map((img, i) => (
                <View key={i} style={styles.imageItem}>
                  <Image source={{ uri: img }} style={styles.imageThumb} />
                  <TouchableOpacity
                    onPress={() => setImages(images.filter((_, idx) => idx !== i))}
                    style={styles.imageRemoveButton}
                  >
                    <X size={12} color="#ffffff" />
                  </TouchableOpacity>
                  {i === 0 ? (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  ) : null}
                </View>
              ))}
              {images.length < 10 ? (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => setShowImageSourceModal(true)}
                  activeOpacity={0.7}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#10b981" />
                  ) : (
                    <>
                      <Camera size={24} color="#10b981" />
                      <Text style={styles.addImageCount}>{images.length}/10</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.photoLimitText}>{t('product.add.photo_limit')}</Text>
          </View>
        ) : null}

        {/* Step 2: Info */}
        {step === 2 ? (
          <View style={styles.formFields}>
            <Text style={styles.stepTitle}>{t('product.add.info')}</Text>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('product.add.item_title')}</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., MacBook Pro 2023"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('product.add.category')}</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerButtonText}>{category}</Text>
              </TouchableOpacity>
            </View>

            {/* Price */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('product.add.price')}</Text>
              <TextInput
                style={styles.textInput}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g., 500000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>

            {/* Condition */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('product.add.condition')}</Text>
              <View style={styles.conditionRow}>
                {conditions.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCondition(c)}
                    style={[
                      styles.conditionChip,
                      condition === c
                        ? styles.conditionChipActive
                        : styles.conditionChipInactive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.conditionChipText,
                        condition === c
                          ? styles.conditionChipTextActive
                          : styles.conditionChipTextInactive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('product.add.description')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('product.add.location')}</Text>
              <View style={styles.locationInputRow}>
                <MapPin size={18} color="#64748b" style={styles.locationIcon} />
                <TextInput
                  style={styles.locationTextInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Gangnam, Seoul"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity
                  style={styles.gpsButton}
                  onPress={fetchCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (
                    <Navigation size={18} color="#10b981" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Step 3: Deal Type */}
        {step === 3 ? (
          <View>
            <Text style={styles.stepTitle}>{t('product.add.deal_type')}</Text>
            <View style={styles.dealTypeOptions}>
              <TouchableOpacity
                style={[
                  styles.dealTypeCard,
                  directDeal
                    ? styles.dealTypeCardActive
                    : styles.dealTypeCardInactive,
                ]}
                onPress={() => setDirectDeal(!directDeal)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dealCheckbox,
                    directDeal && styles.dealCheckboxChecked,
                  ]}
                >
                  {directDeal ? <Check size={14} color="#ffffff" /> : null}
                </View>
                <View style={styles.dealTypeInfo}>
                  <Text style={styles.dealTypeTitle}>{t('product.add.direct')}</Text>
                  <Text style={styles.dealTypeDesc}>
                    Meet in person to complete the trade
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dealTypeCard,
                  parcelService
                    ? styles.dealTypeCardActive
                    : styles.dealTypeCardInactive,
                ]}
                onPress={() => setParcelService(!parcelService)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dealCheckbox,
                    parcelService && styles.dealCheckboxChecked,
                  ]}
                >
                  {parcelService ? <Check size={14} color="#ffffff" /> : null}
                </View>
                <View style={styles.dealTypeInfo}>
                  <Text style={styles.dealTypeTitle}>{t('product.add.parcel')}</Text>
                  <Text style={styles.dealTypeDesc}>
                    Ship via postal/delivery service
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        {step < 3 ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStep(step + 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{t('product.add.next')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handlePublish}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('product.add.publish')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('product.add.category')}</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    category === item && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      category === item && styles.categoryItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {category === item ? <Check size={18} color="#10b981" /> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Source Modal */}
      <Modal
        visible={showImageSourceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageSourceModal(false)}
      >
        <TouchableOpacity
          style={styles.imageSourceOverlay}
          activeOpacity={1}
          onPress={() => setShowImageSourceModal(false)}
        >
          <View style={styles.imageSourceSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.imageSourceTitle}>
              {t('product.add.photo_source_title') || 'Add Photo'}
            </Text>
            <TouchableOpacity
              style={styles.imageSourceOption}
              onPress={() => {
                setShowImageSourceModal(false);
                takePhoto();
              }}
            >
              <Camera size={22} color="#10b981" />
              <Text style={styles.imageSourceOptionText}>
                {t('product.add.photo_from_camera') || 'Take Photo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageSourceOption}
              onPress={() => {
                setShowImageSourceModal(false);
                pickImages();
              }}
            >
              <ImageIcon size={22} color="#10b981" />
              <Text style={styles.imageSourceOptionText}>
                {t('product.add.photo_from_gallery') || 'Choose from Gallery'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageSourceCancel}
              onPress={() => setShowImageSourceModal(false)}
            >
              <Text style={styles.imageSourceCancelText}>
                {t('product.add.cancel') || 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 12,
  },
  stepIndicator: {
    fontSize: 13,
    color: '#64748b',
  },
  // Step bar
  stepBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  stepSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 100,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  // Image grid
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  imageItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coverBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageCount: {
    fontSize: 11,
    color: '#059669',
  },
  photoLimitText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  // Form fields
  formFields: {
    gap: 16,
  },
  fieldGroup: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  gpsButton: {
    padding: 8,
    marginLeft: 4,
  },
  pickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#0f172a',
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  conditionChipActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  conditionChipInactive: {
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  conditionChipText: {
    fontSize: 13,
  },
  conditionChipTextActive: {
    fontWeight: '600',
    color: '#059669',
  },
  conditionChipTextInactive: {
    fontWeight: '400',
    color: '#64748b',
  },
  // Deal type
  dealTypeOptions: {
    gap: 12,
  },
  dealTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  dealTypeCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  dealTypeCardInactive: {
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  dealCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  dealCheckboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dealTypeInfo: {
    flex: 1,
  },
  dealTypeTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 2,
  },
  dealTypeDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Unverified
  unverifiedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  unverifiedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unverifiedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  unverifiedMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    backgroundColor: '#f8faf9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#334155',
  },
  verifyButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  browseText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  categoryItemSelected: {
    backgroundColor: '#ecfdf5',
  },
  categoryItemText: {
    fontSize: 15,
    color: '#334155',
  },
  categoryItemTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  // Image source modal
  imageSourceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  imageSourceSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  imageSourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  imageSourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  imageSourceOptionText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  imageSourceCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  imageSourceCancelText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
});
