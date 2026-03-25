import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Eye,
  Clock,
  BadgeCheck,
  Star,
  Shield,
  ChevronRight,
  MoreVertical,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import * as storage from '../lib/storage';
import * as db from '../lib/db';
import type { Product, User, Review } from '../types';
import type { HomeStackParamList } from '../navigation/AppNavigator';

type DetailNav = NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;
type DetailRoute = RouteProp<HomeStackParamList, 'ProductDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const conditionColors: Record<string, string> = {
  New: '#2563eb',
  'Like New': '#059669',
  Good: '#d97706',
  Fair: '#ea580c',
  Poor: '#dc2626',
};
const conditionBg: Record<string, string> = {
  New: '#dbeafe',
  'Like New': '#d1fae5',
  Good: '#fef3c7',
  Fair: '#fed7aa',
  Poor: '#fee2e2',
};

function formatPrice(price: number): string {
  return '\u20A9' + price.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProductDetailScreen() {
  const navigation = useNavigation<DetailNav>();
  const route = useRoute<DetailRoute>();
  const { productId } = route.params;
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const p = await db.fetchProductById(productId);
      if (p) {
        if (user?.id !== p.sellerId) {
          const newViews = p.views + 1;
          db.updateProductDoc(p.id, { views: newViews }).catch(console.error);
          setProduct({ ...p, views: newViews });
        } else {
          setProduct(p);
        }

        const s = await db.fetchUser(p.sellerId);
        setSeller(s);

        const revs = await storage.getReviewsByUserId(p.sellerId);
        setReviews(revs.slice(0, 3));

        if (user) {
          const liked = await storage.isFavorite(user.id, p.id);
          setIsLiked(liked);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [productId, user]);

  const handleLike = async () => {
    if (!user || !productId) return;
    const liked = await storage.toggleFavorite(user.id, productId);
    setIsLiked(liked);
    setProduct((prev) =>
      prev ? { ...prev, likes: prev.likes + (liked ? 1 : -1) } : prev,
    );
    showToast(t(liked ? 'toast.added_favorite' : 'toast.removed_favorite'));

    // Notify seller when their product is liked
    if (liked && product && product.sellerId !== user.id) {
      await db.createNotification({
        id: db.generateId(),
        userId: product.sellerId,
        type: 'like',
        title: t('notifications.like_title') || 'New Like',
        body: `${user.name} ${t('notifications.liked_your') || 'liked your'} "${product.title}"`,
        relatedId: productId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleChat = async () => {
    if (!user || !product || !seller) return;
    if (user.id === seller.id) {
      showToast('You cannot chat with yourself', 'error');
      return;
    }
    let chat = await db.fetchChatByParticipants(product.id, user.id, seller.id);
    if (!chat) {
      chat = {
        id: db.generateId(),
        productId: product.id,
        buyerId: user.id,
        sellerId: seller.id,
        lastMessage: null,
        lastMessageAt: null,
        unreadCountBuyer: 0,
        unreadCountSeller: 0,
        createdAt: new Date().toISOString(),
      };
      await db.createChat(chat);
    }
    // Navigate to chat - this would go to ChatTab -> ChatRoom
    // For now, show toast since ChatRoom may be on a different tab stack
    showToast(t('toast.chat_created') || 'Chat created');
  };

  const handleOffer = async () => {
    if (!user || !product || !seller) return;
    const price = parseInt(offerPrice.replace(/,/g, ''), 10);
    if (!price || price <= 0 || price >= product.price) {
      showToast('Invalid offer price', 'error');
      return;
    }
    let chat = await db.fetchChatByParticipants(product.id, user.id, seller.id);
    if (!chat) {
      chat = {
        id: db.generateId(),
        productId: product.id,
        buyerId: user.id,
        sellerId: seller.id,
        lastMessage: null,
        lastMessageAt: null,
        unreadCountBuyer: 0,
        unreadCountSeller: 0,
        createdAt: new Date().toISOString(),
      };
      await db.createChat(chat);
    }
    const offerContent = JSON.stringify({
      productId: product.id,
      originalPrice: product.price,
      offerPrice: price,
      status: 'pending',
    });
    const offerMsg = {
      id: db.generateId(),
      chatId: chat.id,
      senderId: user.id,
      messageType: 'offer' as const,
      content: offerContent,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    await db.sendMessage(chat.id, offerMsg, `Offer: ${formatPrice(price)}`);
    setShowOfferModal(false);
    setOfferPrice('');
    showToast(t('toast.offer_sent'));
  };

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#10b981', marginBottom: 12 }}>Re;Tem</Text>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Product not found</Text>
      </View>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '0';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <ArrowLeft size={21} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Share2 size={19} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MoreVertical size={19} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          >
            {product.images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {product.images.length > 1 ? (
            <View style={styles.dotsContainer}>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {product.images.length}
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {product.images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      currentImageIndex === i ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: conditionBg[product.condition] ?? '#f1f5f9' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: conditionColors[product.condition] ?? '#64748b' },
                ]}
              >
                {product.condition}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.badgeText, { color: '#64748b' }]}>
                {product.category}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Eye size={13} color="#94a3b8" />
              <Text style={styles.statText}>{product.views}</Text>
            </View>
            <View style={styles.statItem}>
              <Heart size={13} color="#94a3b8" />
              <Text style={styles.statText}>{product.likes}</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={13} color="#94a3b8" />
              <Text style={styles.statText}>{timeAgo(product.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>{t('product.detail.description')}</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>

          <View style={styles.divider} />

          {/* Seller Card */}
          {seller ? (
            <>
              <Text style={styles.sectionTitle}>{t('product.detail.seller')}</Text>
              <TouchableOpacity style={styles.sellerCard} activeOpacity={0.7}>
                <Image
                  source={{ uri: seller.profileImage }}
                  style={styles.sellerAvatar}
                />
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>{seller.fullName}</Text>
                    {seller.verified ? (
                      <BadgeCheck size={14} color="#10b981" />
                    ) : null}
                  </View>
                  <View style={styles.sellerMetaRow}>
                    <View style={styles.sellerMetaItem}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <Text style={styles.sellerMetaText}>
                        {avgRating} ({reviews.length})
                      </Text>
                    </View>
                    <View style={styles.sellerMetaItem}>
                      <MapPin size={11} color="#64748b" />
                      <Text style={styles.sellerMetaText}>{seller.location}</Text>
                    </View>
                  </View>
                  <View style={styles.sellerMetaItem}>
                    <Shield size={10} color="#10b981" />
                    <Text style={styles.sellerTrustText}>
                      Trust: {seller.trustScore}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#cbd5e1" />
              </TouchableOpacity>
            </>
          ) : null}

          {/* Deal Type */}
          <Text style={styles.sectionTitle}>{t('product.detail.deal_type')}</Text>
          <View style={styles.dealTypeRow}>
            {product.dealTypes.includes('direct') ? (
              <View style={[styles.dealBadge, { backgroundColor: '#d1fae5' }]}>
                <Text style={[styles.dealBadgeText, { color: '#059669' }]}>
                  Direct
                </Text>
              </View>
            ) : null}
            {product.dealTypes.includes('parcel') ? (
              <View style={[styles.dealBadge, { backgroundColor: '#dbeafe' }]}>
                <Text style={[styles.dealBadgeText, { color: '#2563eb' }]}>
                  Parcel
                </Text>
              </View>
            ) : null}
          </View>

          {/* Reviews */}
          {reviews.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                {t('product.detail.reviews')} ({reviews.length})
              </Text>
              {reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={10}
                          color="#f59e0b"
                          fill={s <= rev.rating ? '#f59e0b' : 'none'}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                  <Text style={styles.reviewTime}>{timeAgo(rev.createdAt)}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
        <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
          <Heart
            size={20}
            color={isLiked ? '#ef4444' : '#94a3b8'}
            fill={isLiked ? '#ef4444' : 'none'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            user?.verified ? handleChat() : setShowVerifyPrompt(true)
          }
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonText}>{t('product.detail.chat')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.offerButton}
          onPress={() =>
            user?.verified ? setShowOfferModal(true) : setShowVerifyPrompt(true)
          }
          activeOpacity={0.8}
        >
          <Text style={styles.offerButtonText}>{t('product.detail.offer')}</Text>
        </TouchableOpacity>
      </View>

      {/* Offer Modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.offerModalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.offerModalTitle}>{t('product.offer.title')}</Text>
            <Text style={styles.offerOriginalPrice}>
              {t('product.offer.original')}: {formatPrice(product.price)}
            </Text>
            <TextInput
              style={styles.offerInput}
              placeholder={t('product.offer.price')}
              placeholderTextColor="#94a3b8"
              value={offerPrice}
              onChangeText={setOfferPrice}
              keyboardType="numeric"
            />
            <View style={styles.offerButtonsRow}>
              <TouchableOpacity
                style={styles.offerCancelButton}
                onPress={() => setShowOfferModal(false)}
              >
                <Text style={styles.offerCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.offerSendButton}
                onPress={handleOffer}
              >
                <Text style={styles.offerSendText}>{t('product.offer.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Prompt */}
      <Modal
        visible={showVerifyPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyPrompt(false)}
      >
        <TouchableOpacity
          style={styles.verifyOverlay}
          activeOpacity={1}
          onPress={() => setShowVerifyPrompt(false)}
        >
          <View style={styles.verifyContent}>
            <View style={styles.verifyIconContainer}>
              <Shield size={32} color="#f59e0b" />
            </View>
            <Text style={styles.verifyTitle}>{t('verify.restriction_title')}</Text>
            <Text style={styles.verifyMessage}>{t('verify.unverified_chat')}</Text>
            <TouchableOpacity
              style={styles.verifyActionButton}
              onPress={() => {
                setShowVerifyPrompt(false);
                // Navigate to verification screen
              }}
            >
              <Text style={styles.verifyActionText}>
                {t('verify.unverified_action')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.verifyCancelButton}
              onPress={() => setShowVerifyPrompt(false)}
            >
              <Text style={styles.verifyCancelText}>{t('common.cancel')}</Text>
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
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748b',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerButton: {
    padding: 6,
    borderRadius: 10,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  // Image Carousel
  imageCarousel: {
    width: SCREEN_WIDTH,
    aspectRatio: 1 / 0.75,
    backgroundColor: '#f1f5f9',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  imageCounter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  imageCounterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#10b981',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  // Info
  infoSection: {
    padding: 16,
  },
  productTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 25,
  },
  productPrice: {
    fontSize: 23,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  descriptionText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 22,
  },
  // Seller
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sellerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sellerName: {
    fontWeight: '600',
    fontSize: 13,
    color: '#0f172a',
  },
  sellerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  sellerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sellerMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  sellerTrustText: {
    fontSize: 10,
    color: '#64748b',
  },
  // Deal type
  dealTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dealBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dealBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Reviews
  reviewCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewComment: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  reviewTime: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 4,
  },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  offerButton: {
    flex: 0.7,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  // Offer Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  offerModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  offerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    color: '#0f172a',
  },
  offerOriginalPrice: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  offerInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 14,
  },
  offerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  offerCancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  offerCancelText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  offerSendButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  offerSendText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Verify prompt
  verifyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifyContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    paddingHorizontal: 24,
    maxWidth: 360,
    width: '100%',
    alignItems: 'center',
  },
  verifyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  verifyMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  verifyActionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyCancelButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  verifyCancelText: {
    color: '#64748b',
    fontSize: 14,
  },
});
