import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Bell,
  Eye,
  Heart,
  MapPin,
  Clock,
  BadgeCheck,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../lib/db';
import type { Product, User } from '../types';
import type { HomeStackParamList } from '../navigation/AppNavigator';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

const categoryItems = [
  { value: 'All', key: 'home.all' },
  { value: 'Electronics', key: 'category.electronics' },
  { value: 'Fashion', key: 'category.fashion' },
  { value: 'Home & Living', key: 'category.home_living' },
  { value: 'Sports & Outdoors', key: 'category.sports' },
  { value: 'Books & Media', key: 'category.books' },
  { value: 'Furniture', key: 'category.furniture' },
  { value: 'Toys & Games', key: 'category.toys' },
  { value: 'Beauty & Health', key: 'category.beauty' },
  { value: 'Others', key: 'category.others' },
];

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatPrice(price: number): string {
  return '\u20A9' + price.toLocaleString();
}

interface ProductCardProps {
  product: Product;
  seller?: User | null;
  onPress: () => void;
}

const ProductCard = React.memo(function ProductCard({ product, seller, onPress }: ProductCardProps) {
  const condColor = conditionColors[product.condition] || '#64748b';
  const condBg = conditionBg[product.condition] || '#f1f5f9';
  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: product.images[0] }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
        {seller && (
          <View style={styles.sellerRow}>
            <Text style={styles.sellerName}>{seller.fullName}</Text>
            {seller.verified && <BadgeCheck size={14} color="#10b981" />}
          </View>
        )}
        <View style={styles.metaRow}>
          <MapPin size={11} color="#94a3b8" />
          <Text style={styles.metaText} numberOfLines={1}>{product.location}</Text>
          <View style={[styles.conditionBadge, { backgroundColor: condBg }]}>
            <Text style={[styles.conditionText, { color: condColor }]}>{product.condition}</Text>
          </View>
          <View style={styles.metaItem}>
            <Eye size={11} color="#94a3b8" />
            <Text style={styles.metaTextLight}>{product.views}</Text>
          </View>
          <View style={styles.metaItem}>
            <Heart size={11} color="#94a3b8" />
            <Text style={styles.metaTextLight}>{product.likes}</Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <Clock size={11} color="#cbd5e1" />
          <Text style={styles.timeText}>{timeAgo(product.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sort, setSort] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellersMap, setSellersMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();

  const loadProducts = useCallback(async () => {
    try {
      const data = await db.fetchProducts();
      setProducts(data);

      const sellerIds = new Set(data.map((p) => p.sellerId));
      const sellers: Record<string, User> = {};
      await Promise.all(
        Array.from(sellerIds).map(async (sid) => {
          const u = await db.fetchUser(sid);
          if (u) sellers[sid] = u;
        }),
      );
      setSellersMap(sellers);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Real-time unread notification count via Firestore onSnapshot
  useEffect(() => {
    if (!user) return;
    const unsubscribe = db.subscribeToUnreadNotifications(user.id, (count) => {
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const filteredAndSortedProducts = useMemo<Product[]>(() => {
    let items = [...products].filter((p) => p.status === 'active');
    if (selectedCategory !== 'All') {
      items = items.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case 'price_low':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        items.sort(
          (a, b) => b.views * 0.3 + b.likes * 0.7 - (a.views * 0.3 + a.likes * 0.7),
        );
        break;
      default:
        items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
    return items;
  }, [products, selectedCategory, sort, searchQuery]);

  const sortOptions = useMemo(
    () => [
      { key: 'latest', label: t('home.sort.latest') },
      { key: 'price_low', label: t('home.sort.price_low') },
      { key: 'price_high', label: t('home.sort.price_high') },
      { key: 'popular', label: t('home.sort.popular') },
    ],
    [t],
  );

  const renderProductCard = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        seller={sellersMap[item.sellerId]}
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item.id })
        }
      />
    ),
    [navigation, sellersMap],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const renderListEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Search size={32} color="#94a3b8" />
        </View>
        <Text style={styles.emptyTitle}>{t('empty.no_products')}</Text>
        <Text style={styles.emptyDesc}>{t('empty.no_products_desc')}</Text>
      </View>
    ),
    [t],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#10b981', marginBottom: 16 }}>Re;Tem</Text>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerLogo}>Re;Tem</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowSearch(true)}
            style={styles.headerIconButton}
          >
            <Search size={22} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={22} color="#334155" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
        {categoryItems.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => setSelectedCategory(cat.value)}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value
                ? styles.categoryChipActive
                : styles.categoryChipInactive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.value
                  ? styles.categoryChipTextActive
                  : styles.categoryChipTextInactive,
              ]}
            >
              {t(cat.key) || cat.value}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {sortOptions.map((s) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setSort(s.key)}
            style={[
              styles.sortButton,
              sort === s.key && styles.sortButtonActive,
            ]}
          >
            <Text
              style={[
                styles.sortText,
                sort === s.key
                  ? styles.sortTextActive
                  : styles.sortTextInactive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product List */}
      <FlatList
        data={filteredAndSortedProducts}
        renderItem={renderProductCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      />

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.searchOverlay}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.search_placeholder') || 'Search products...'}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setShowSearch(false);
              }}
            >
              <X size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10b981',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    padding: 6,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  // Categories
  categoryContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    overflow: 'visible',
  },
  categoryContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  categoryChipActive: {
    backgroundColor: '#10b981',
  },
  categoryChipInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  categoryChipTextInactive: {
    color: '#64748b',
  },
  // Sort
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  sortButton: {
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sortButtonActive: {
    borderBottomColor: '#10b981',
  },
  sortText: {
    fontSize: 12,
  },
  sortTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  sortTextInactive: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  // Product list
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 80,
  },
  // Product card
  productCard: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  sellerName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  metaTextLight: {
    fontSize: 11,
    color: '#94a3b8',
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#334155',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Search modal
  searchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingTop: 48,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
});
