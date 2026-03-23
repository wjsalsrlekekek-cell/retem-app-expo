import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Trash2,
  CheckCircle,
  MoreVertical,
  Eye,
  Heart,
  RotateCcw,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import * as storage from '../lib/storage';
import type { Product } from '../types';

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

export default function MyListingsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [menuProductId, setMenuProductId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    const all = await storage.getProducts();
    const mine = all.filter((p) => p.sellerId === user.id && p.status !== 'deleted');
    setProducts(mine);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const activeProducts = useMemo(
    () =>
      products
        .filter((p) => p.status === 'active' || p.status === 'reserved')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [products],
  );

  const soldProducts = useMemo(
    () =>
      products
        .filter((p) => p.status === 'sold')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [products],
  );

  const currentList = activeTab === 'active' ? activeProducts : soldProducts;

  const handleMarkSold = useCallback(
    async (productId: string) => {
      await storage.updateProduct(productId, { status: 'sold', updatedAt: new Date().toISOString() });
      showToast(t('myListings.marked_sold') || 'Marked as sold');
      setMenuProductId(null);
      await loadProducts();
    },
    [loadProducts, showToast, t],
  );

  const handleReactivate = useCallback(
    async (productId: string) => {
      await storage.updateProduct(productId, { status: 'active', updatedAt: new Date().toISOString() });
      showToast(t('myListings.reactivated') || 'Product reactivated');
      setMenuProductId(null);
      await loadProducts();
    },
    [loadProducts, showToast, t],
  );

  const handleDelete = useCallback(
    (productId: string) => {
      Alert.alert(
        t('myListings.delete_title') || 'Delete Product',
        t('myListings.delete_confirm') || 'Are you sure you want to delete this product?',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel', onPress: () => setMenuProductId(null) },
          {
            text: t('common.delete') || 'Delete',
            style: 'destructive',
            onPress: async () => {
              await storage.updateProduct(productId, { status: 'deleted', updatedAt: new Date().toISOString() });
              showToast(t('myListings.deleted') || 'Product deleted');
              setMenuProductId(null);
              await loadProducts();
            },
          },
        ],
      );
    },
    [loadProducts, showToast, t],
  );

  const menuProduct = useMemo(
    () => (menuProductId ? products.find((p) => p.id === menuProductId) : null),
    [menuProductId, products],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myListings.title') || 'My Products'}</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Package size={16} color={activeTab === 'active' ? '#10b981' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            {t('myListings.active') || 'Active'} ({activeProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sold' && styles.tabActive]}
          onPress={() => setActiveTab('sold')}
        >
          <ShoppingBag size={16} color={activeTab === 'sold' ? '#10b981' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'sold' && styles.tabTextActive]}>
            {t('myListings.sold') || 'Sold'} ({soldProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />
        }
      >
        {currentList.length === 0 ? (
          <View style={styles.emptyContainer}>
            {activeTab === 'active' ? (
              <>
                <Package size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>{t('myListings.empty_active') || 'No active listings'}</Text>
                <Text style={styles.emptyDesc}>
                  {t('myListings.empty_active_desc') || 'Start selling by adding a product'}
                </Text>
              </>
            ) : (
              <>
                <ShoppingBag size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>{t('myListings.empty_sold') || 'No sold items'}</Text>
                <Text style={styles.emptyDesc}>
                  {t('myListings.empty_sold_desc') || 'Items you sell will appear here'}
                </Text>
              </>
            )}
          </View>
        ) : (
          currentList.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image
                source={{ uri: product.images[0] || 'https://via.placeholder.com/80' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Eye size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>{product.views}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Heart size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>{product.likes}</Text>
                  </View>
                  <Text style={styles.timeText}>{timeAgo(product.createdAt)}</Text>
                </View>
                {product.status === 'sold' && (
                  <View style={styles.soldBadge}>
                    <Text style={styles.soldBadgeText}>{t('myListings.sold') || 'Sold'}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuProductId(product.id)}>
                <MoreVertical size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal
        visible={!!menuProductId}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuProductId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuProductId(null)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {menuProduct?.title || ''}
            </Text>

            {menuProduct?.status === 'active' || menuProduct?.status === 'reserved' ? (
              <>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => menuProductId && handleMarkSold(menuProductId)}
                >
                  <CheckCircle size={20} color="#10b981" />
                  <Text style={styles.menuOptionText}>{t('myListings.mark_sold') || 'Mark as Sold'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => menuProductId && handleDelete(menuProductId)}
                >
                  <Trash2 size={20} color="#ef4444" />
                  <Text style={[styles.menuOptionText, { color: '#ef4444' }]}>
                    {t('myListings.delete') || 'Delete'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : menuProduct?.status === 'sold' ? (
              <>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => menuProductId && handleReactivate(menuProductId)}
                >
                  <RotateCcw size={20} color="#3b82f6" />
                  <Text style={[styles.menuOptionText, { color: '#3b82f6' }]}>
                    {t('myListings.reactivate') || 'Reactivate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => menuProductId && handleDelete(menuProductId)}
                >
                  <Trash2 size={20} color="#ef4444" />
                  <Text style={[styles.menuOptionText, { color: '#ef4444' }]}>
                    {t('myListings.delete') || 'Delete'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuProductId(null)}>
              <Text style={styles.menuCancelText}>{t('common.cancel') || 'Cancel'}</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  timeText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  soldBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  soldBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  menuBtn: {
    padding: 6,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  menuCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
