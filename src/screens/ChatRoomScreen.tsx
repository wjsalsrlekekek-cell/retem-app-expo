import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Globe,
  Star,
  CheckCircle,
  X,
  ShoppingBag,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import * as storage from '../lib/storage';
import * as db from '../lib/db';
import { translateChatMessage, LANG_DISPLAY_NAMES } from '../lib/translate';
import type { Chat, Message, User, Product, OfferContent } from '../types';
import type { ChatStackParamList } from '../navigation/AppNavigator';

type ChatRoomRoute = RouteProp<ChatStackParamList, 'ChatRoom'>;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatPrice(price: number): string {
  return '\u20A9' + price.toLocaleString();
}

const AUTO_TRANSLATE_KEY = 'retem_auto_translate';

export default function ChatRoomScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const route = useRoute<ChatRoomRoute>();
  const { chatId } = route.params;
  const insets = useSafeAreaInsets();

  const flatListRef = useRef<FlatList>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  // Auto-translate
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Load chat data
  useEffect(() => {
    (async () => {
      const chatData = await db.fetchChatById(chatId);
      if (!chatData || !user) {
        setLoading(false);
        return;
      }
      setChat(chatData);

      const otherId = chatData.buyerId === user.id ? chatData.sellerId : chatData.buyerId;
      const [otherUserData, productData] = await Promise.all([
        db.fetchUser(otherId),
        db.fetchProductById(chatData.productId),
      ]);
      setOtherUser(otherUserData);
      setProduct(productData);

      // Check if already reviewed
      if (productData) {
        const reviewed = await storage.hasReviewForProduct(user.id, productData.id);
        setHasReviewed(reviewed);
      }

      // Load auto-translate preference
      const autoTranslatePref = await AsyncStorage.getItem(AUTO_TRANSLATE_KEY);
      setAutoTranslate(autoTranslatePref === 'true');

      setLoading(false);
    })();
  }, [chatId, user]);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = db.subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
    });

    return unsubscribe;
  }, [chatId]);

  // Auto-translate new messages
  useEffect(() => {
    if (!autoTranslate || !otherUser || !user) return;

    const untranslated = messages.filter(
      (m) =>
        m.senderId !== user.id &&
        m.messageType === 'text' &&
        !translatedMessages[m.id] &&
        !translatingIds.has(m.id),
    );

    if (untranslated.length === 0) return;

    untranslated.forEach(async (msg) => {
      setTranslatingIds((prev) => new Set(prev).add(msg.id));
      const translated = await translateChatMessage(msg.content, otherUser.language || 'auto', language);
      setTranslatedMessages((prev) => ({ ...prev, [msg.id]: translated }));
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(msg.id);
        return next;
      });
    });
  }, [messages, autoTranslate, otherUser, user, language, translatedMessages, translatingIds]);

  const toggleAutoTranslate = useCallback(async () => {
    const newVal = !autoTranslate;
    setAutoTranslate(newVal);
    await AsyncStorage.setItem(AUTO_TRANSLATE_KEY, newVal ? 'true' : 'false');
    if (!newVal) {
      setTranslatedMessages({});
    }
  }, [autoTranslate]);

  const translateSingleMessage = useCallback(
    async (msg: Message) => {
      if (translatedMessages[msg.id]) {
        // Toggle off
        setTranslatedMessages((prev) => {
          const next = { ...prev };
          delete next[msg.id];
          return next;
        });
        return;
      }
      setTranslatingIds((prev) => new Set(prev).add(msg.id));
      const translated = await translateChatMessage(
        msg.content,
        otherUser?.language || 'auto',
        language,
      );
      setTranslatedMessages((prev) => ({ ...prev, [msg.id]: translated }));
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(msg.id);
        return next;
      });
    },
    [translatedMessages, otherUser, language],
  );

  const send = useCallback(async () => {
    if (!text.trim() || !user || !chat) return;
    const messageText = text.trim();
    setText('');

    const msg: Message = {
      id: storage.uuid(),
      chatId,
      senderId: user.id,
      messageType: 'text',
      content: messageText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await db.sendMessage(chatId, msg, messageText);
  }, [text, user, chat, chatId]);

  const handleAcceptOffer = useCallback(
    async (msg: Message) => {
      if (!user || !chat) return;

      // Update the message content to mark offer as accepted
      const offerContent: OfferContent = JSON.parse(msg.content);
      offerContent.status = 'accepted';

      // Update in AsyncStorage directly
      const chatMessagesKey = `retem_messages_${chatId}`;
      const raw = await AsyncStorage.getItem(chatMessagesKey);
      const allMsgs: Message[] = raw ? JSON.parse(raw) : [];
      const idx = allMsgs.findIndex((m) => m.id === msg.id);
      if (idx >= 0) {
        allMsgs[idx].content = JSON.stringify(offerContent);
        await AsyncStorage.setItem(chatMessagesKey, JSON.stringify(allMsgs));
      }

      showToast(t('chat.offer_accepted') || 'Offer accepted!');
    },
    [user, chat, chatId, showToast, t],
  );

  const handleRejectOffer = useCallback(
    async (msg: Message) => {
      if (!user || !chat) return;

      const offerContent: OfferContent = JSON.parse(msg.content);
      offerContent.status = 'rejected';

      const chatMessagesKey = `retem_messages_${chatId}`;
      const raw = await AsyncStorage.getItem(chatMessagesKey);
      const allMsgs: Message[] = raw ? JSON.parse(raw) : [];
      const idx = allMsgs.findIndex((m) => m.id === msg.id);
      if (idx >= 0) {
        allMsgs[idx].content = JSON.stringify(offerContent);
        await AsyncStorage.setItem(chatMessagesKey, JSON.stringify(allMsgs));
      }

      showToast(t('chat.offer_rejected') || 'Offer rejected');
    },
    [user, chat, chatId, showToast, t],
  );

  const handleCompleteTransaction = useCallback(async () => {
    if (!user || !chat || !product) return;

    Alert.alert(
      t('chat.complete_title') || 'Complete Transaction',
      t('chat.complete_confirm') || 'Are you sure you want to mark this transaction as complete?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.confirm') || 'Confirm',
          onPress: async () => {
            await storage.updateProduct(product.id, { status: 'sold', updatedAt: new Date().toISOString() });
            setProduct((prev) => (prev ? { ...prev, status: 'sold' } : prev));

            // Send system message
            const sysMsg: Message = {
              id: storage.uuid(),
              chatId,
              senderId: 'system',
              messageType: 'system',
              content: t('chat.transaction_complete_msg') || 'Transaction completed! Please leave a review.',
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            await db.sendMessage(chatId, sysMsg, sysMsg.content);
            showToast(t('chat.transaction_completed') || 'Transaction completed!');
          },
        },
      ],
    );
  }, [user, chat, product, chatId, showToast, t]);

  const handleSubmitReview = useCallback(async () => {
    if (!user || !product || !otherUser) return;
    setSubmittingReview(true);

    const review = {
      id: storage.uuid(),
      reviewerId: user.id,
      revieweeId: otherUser.id,
      productId: product.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
    };

    await storage.addReview(review);
    setHasReviewed(true);
    setShowReviewModal(false);
    setReviewRating(5);
    setReviewComment('');
    setSubmittingReview(false);
    showToast(t('chat.review_submitted') || 'Review submitted!');
  }, [user, product, otherUser, reviewRating, reviewComment, showToast, t]);

  // Check if an offer has been accepted (to show complete transaction button)
  const hasAcceptedOffer = messages.some((m) => {
    if (m.messageType !== 'offer') return false;
    try {
      const content: OfferContent = JSON.parse(m.content);
      return content.status === 'accepted';
    } catch {
      return false;
    }
  });

  const isSeller = chat?.sellerId === user?.id;
  const showCompleteBtn = hasAcceptedOffer && product?.status === 'active' && isSeller;
  const showReviewBtn = product?.status === 'sold' && !hasReviewed;

  const renderMessage = useCallback(
    ({ item: msg }: { item: Message }) => {
      if (!user) return null;
      const isMine = msg.senderId === user.id;

      // System message
      if (msg.messageType === 'system') {
        return (
          <View style={styles.systemMsgContainer}>
            <View style={styles.systemMsgBubble}>
              <CheckCircle size={14} color="#10b981" />
              <Text style={styles.systemMsgText}>{msg.content}</Text>
            </View>
          </View>
        );
      }

      // Offer message
      if (msg.messageType === 'offer') {
        let offerContent: OfferContent;
        try {
          offerContent = JSON.parse(msg.content);
        } catch {
          return null;
        }

        const isPending = offerContent.status === 'pending';
        const isAccepted = offerContent.status === 'accepted';
        const isRejected = offerContent.status === 'rejected';
        const canRespond = !isMine && isPending;

        return (
          <View style={[styles.offerContainer, isMine ? styles.offerRight : styles.offerLeft]}>
            <View style={styles.offerBubble}>
              <Text style={styles.offerLabel}>{t('chat.price_offer') || 'Price Offer'}</Text>
              <Text style={styles.offerOriginal}>
                {t('chat.original_price') || 'Original'}: {formatPrice(offerContent.originalPrice)}
              </Text>
              <Text style={styles.offerPrice}>
                {t('chat.offer_price') || 'Offer'}: {formatPrice(offerContent.offerPrice)}
              </Text>

              {isAccepted && (
                <View style={styles.offerStatusBadge}>
                  <CheckCircle size={14} color="#10b981" />
                  <Text style={[styles.offerStatusText, { color: '#10b981' }]}>
                    {t('chat.accepted') || 'Accepted'}
                  </Text>
                </View>
              )}
              {isRejected && (
                <View style={styles.offerStatusBadge}>
                  <X size={14} color="#ef4444" />
                  <Text style={[styles.offerStatusText, { color: '#ef4444' }]}>
                    {t('chat.rejected') || 'Rejected'}
                  </Text>
                </View>
              )}

              {canRespond && (
                <View style={styles.offerActions}>
                  <TouchableOpacity
                    style={[styles.offerActionBtn, styles.offerAcceptBtn]}
                    onPress={() => handleAcceptOffer(msg)}
                  >
                    <Text style={styles.offerAcceptText}>{t('chat.accept') || 'Accept'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.offerActionBtn, styles.offerRejectBtn]}
                    onPress={() => handleRejectOffer(msg)}
                  >
                    <Text style={styles.offerRejectText}>{t('chat.reject') || 'Reject'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.msgTime}>{timeAgo(msg.createdAt)}</Text>
          </View>
        );
      }

      // Text message
      const translated = translatedMessages[msg.id];
      const isTranslating = translatingIds.has(msg.id);

      return (
        <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
          {!isMine && otherUser && (
            <Image source={{ uri: otherUser.profileImage }} style={styles.msgAvatar} />
          )}
          <View style={[styles.msgBubbleWrap, isMine ? styles.msgWrapRight : styles.msgWrapLeft]}>
            <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleTheirs]}>
              <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextTheirs]}>
                {msg.content}
              </Text>
            </View>

            {/* Translation */}
            {translated && (
              <View style={styles.msgTranslation}>
                <Globe size={10} color="#3b82f6" />
                <Text style={styles.msgTranslationText}>{translated}</Text>
              </View>
            )}

            <View style={styles.msgMeta}>
              <Text style={styles.msgTime}>{timeAgo(msg.createdAt)}</Text>

              {!isMine && msg.messageType === 'text' && (
                <TouchableOpacity onPress={() => translateSingleMessage(msg)} style={styles.msgTranslateBtn}>
                  {isTranslating ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <Globe size={12} color={translated ? '#94a3b8' : '#3b82f6'} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    },
    [
      user,
      otherUser,
      translatedMessages,
      translatingIds,
      handleAcceptOffer,
      handleRejectOffer,
      translateSingleMessage,
      t,
    ],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!chat || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('chat.not_found') || 'Chat not found'}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {otherUser && (
            <Image source={{ uri: otherUser.profileImage }} style={styles.headerAvatar} />
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUser?.fullName || 'Unknown'}
            </Text>
            {product && (
              <Text style={styles.headerProduct} numberOfLines={1}>
                {product.title}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={toggleAutoTranslate}
          style={[styles.translateToggle, autoTranslate && styles.translateToggleActive]}
        >
          <Globe size={18} color={autoTranslate ? '#ffffff' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Auto-translate banner */}
      {autoTranslate && (
        <View style={styles.translateBanner}>
          <Globe size={14} color="#3b82f6" />
          <Text style={styles.translateBannerText}>
            {t('chat.auto_translate_on') || 'Auto-translate is on'} ({LANG_DISPLAY_NAMES[language] || language})
          </Text>
        </View>
      )}

      {/* Product banner */}
      {product && (
        <TouchableOpacity
          style={styles.productBanner}
          onPress={() =>
            navigation.navigate('HomeTab', {
              screen: 'ProductDetail',
              params: { productId: product.id },
            })
          }
        >
          <Image
            source={{ uri: product.images[0] || 'https://via.placeholder.com/40' }}
            style={styles.productBannerImage}
          />
          <View style={styles.productBannerInfo}>
            <Text style={styles.productBannerTitle} numberOfLines={1}>
              {product.title}
            </Text>
            <Text style={styles.productBannerPrice}>{formatPrice(product.price)}</Text>
          </View>
          {product.status === 'sold' && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>{t('product.sold') || 'Sold'}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Complete Transaction / Review buttons */}
      {showCompleteBtn && (
        <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteTransaction}>
          <ShoppingBag size={16} color="#ffffff" />
          <Text style={styles.completeBtnText}>
            {t('chat.complete_transaction') || 'Complete Transaction'}
          </Text>
        </TouchableOpacity>
      )}
      {showReviewBtn && (
        <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReviewModal(true)}>
          <Star size={16} color="#ffffff" />
          <Text style={styles.reviewBtnText}>{t('chat.write_review') || 'Write Review'}</Text>
        </TouchableOpacity>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesText}>
              {t('chat.no_messages') || 'No messages yet. Start the conversation!'}
            </Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('chat.input') || 'Type a message...'}
          placeholderTextColor="#94a3b8"
          style={styles.textInput}
          onSubmitEditing={() => send()}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={() => send()}
          disabled={!text.trim()}
          style={[styles.sendBtn, text.trim() ? styles.sendBtnActive : null]}
        >
          <Send size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewModal}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>{t('chat.review_title') || 'Write a Review'}</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {otherUser && (
              <View style={styles.reviewUserRow}>
                <Image source={{ uri: otherUser.profileImage }} style={styles.reviewAvatar} />
                <Text style={styles.reviewUserName}>{otherUser.fullName}</Text>
              </View>
            )}

            {/* Star rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={styles.starBtn}>
                  <Star
                    size={32}
                    color="#f59e0b"
                    fill={star <= reviewRating ? '#f59e0b' : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>{reviewRating}/5</Text>

            <TextInput
              style={styles.reviewInput}
              placeholder={t('chat.review_placeholder') || 'Share your experience...'}
              placeholderTextColor="#94a3b8"
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.reviewSubmitBtn, submittingReview && styles.reviewSubmitBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.reviewSubmitText}>{t('chat.submit_review') || 'Submit Review'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerProduct: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  translateToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  translateToggleActive: {
    backgroundColor: '#3b82f6',
  },
  // Translate banner
  translateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  translateBannerText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  // Product banner
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  productBannerImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  productBannerInfo: {
    flex: 1,
  },
  productBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  productBannerPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 1,
  },
  soldBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  soldBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  // Complete / Review buttons
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    marginHorizontal: 14,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  completeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f59e0b',
    marginHorizontal: 14,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reviewBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  // Messages
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  // Message rows
  msgRow: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '80%',
  },
  msgRowLeft: {
    alignSelf: 'flex-start',
  },
  msgRowRight: {
    alignSelf: 'flex-end',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    marginTop: 2,
  },
  msgBubbleWrap: {},
  msgWrapRight: {
    alignItems: 'flex-end',
  },
  msgWrapLeft: {
    alignItems: 'flex-start',
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  msgBubbleMine: {
    backgroundColor: '#10b981',
    borderBottomRightRadius: 4,
  },
  msgBubbleTheirs: {
    backgroundColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMine: {
    color: '#ffffff',
  },
  msgTextTheirs: {
    color: '#0f172a',
  },
  msgTranslation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
    maxWidth: '100%',
  },
  msgTranslationText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  msgTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  msgTranslateBtn: {
    padding: 2,
  },
  // System message
  systemMsgContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMsgBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  systemMsgText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  // Offer message
  offerContainer: {
    marginBottom: 10,
    maxWidth: '75%',
  },
  offerRight: {
    alignSelf: 'flex-end',
  },
  offerLeft: {
    alignSelf: 'flex-start',
  },
  offerBubble: {
    backgroundColor: '#fefce8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a16207',
    marginBottom: 6,
  },
  offerOriginal: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  offerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  offerStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  offerActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  offerAcceptBtn: {
    backgroundColor: '#10b981',
  },
  offerAcceptText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  offerRejectBtn: {
    backgroundColor: '#fee2e2',
  },
  offerRejectText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#10b981',
  },
  // Review Modal
  reviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  reviewModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 16,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 80,
    marginBottom: 16,
  },
  reviewSubmitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewSubmitBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  reviewSubmitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
