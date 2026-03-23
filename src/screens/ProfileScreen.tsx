import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Modal,
  TextInput, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User, ChevronRight, ShoppingBag, Heart, Star, Shield,
  Settings, HelpCircle, LogOut, Edit2, MapPin, BadgeCheck, X,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { getProducts, getUserFavorites, getReviewsByUserId, updateUser } from '../lib/storage';
import type { Product, Review } from '../types';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [sellingCount, setSellingCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const products = await getProducts();
      const myProducts = products.filter((p: Product) => p.sellerId === user.id);
      setSellingCount(myProducts.filter((p: Product) => p.status === 'active').length);
      setSoldCount(myProducts.filter((p: Product) => p.status === 'sold').length);

      const reviews = await getReviewsByUserId(user.id);
      setReviewCount(reviews.length);
      if (reviews.length > 0) {
        setAvgRating(reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length);
      }
    } catch (e) {
      console.error('Error loading profile data:', e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadData();
    setRefreshing(false);
  };

  const openEditModal = () => {
    if (!user) return;
    setEditName(user.fullName);
    setEditLocation(user.location || '');
    setEditModalVisible(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!editName.trim()) {
      showToast(t('error.name_required') || 'Name is required', 'error');
      return;
    }
    await updateUser(user.id, {
      fullName: editName.trim(),
      location: editLocation.trim(),
      updatedAt: new Date().toISOString(),
    });
    await refreshUser();
    setEditModalVisible(false);
    showToast(t('profile.updated') || 'Profile updated', 'success');
  };

  const handleLogout = async () => {
    await logout();
    showToast(t('profile.logged_out') || 'Logged out', 'info');
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const trustLevel =
    user.trustScore >= 80 ? t('trust.excellent') || 'Excellent' :
    user.trustScore >= 60 ? t('trust.good') || 'Good' :
    user.trustScore >= 40 ? t('trust.fair') || 'Fair' :
    t('trust.needs_improvement') || 'Needs Improvement';

  const menuItems = [
    { icon: ShoppingBag, label: t('profile.my_products') || 'My Listings', screen: 'MyListings' },
    { icon: Heart, label: t('profile.favorites') || 'Favorites', screen: 'Favorites' },
    { icon: Star, label: t('profile.reviews') || 'My Reviews', screen: 'MyReviews' },
    { icon: Shield, label: t('profile.trust_score') || 'Trust Score', screen: 'TrustScore' },
    { icon: BadgeCheck, label: t('profile.verification') || 'Verification', screen: 'Verification' },
    { icon: Settings, label: t('profile.settings') || 'Settings', screen: 'Settings' },
    { icon: HelpCircle, label: t('profile.help') || 'Help', screen: 'Help' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      {/* Screen Header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.screenHeaderTitle}>{t('profile.title') || 'My Profile'}</Text>
      </View>

      {/* Profile Header */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}` }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.fullName}>{user.fullName}</Text>
              {user.verified && <BadgeCheck size={18} color="#10b981" />}
            </View>
            <Text style={styles.email}>{user.email}</Text>
            {user.location ? (
              <View style={styles.locationRow}>
                <MapPin size={14} color="#9ca3af" />
                <Text style={styles.locationText}>{user.location}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={openEditModal} style={styles.editBtn}>
            <Edit2 size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Trust Badge */}
        <TouchableOpacity
          style={styles.trustBadge}
          onPress={() => navigation.navigate('TrustScore')}
        >
          <Shield size={16} color="#10b981" />
          <Text style={styles.trustScore}>{user.trustScore}</Text>
          <Text style={styles.trustLevel}>{trustLevel}</Text>
          <ChevronRight size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.card}>
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('MyListings')}>
            <Text style={styles.statNumber}>{sellingCount}</Text>
            <Text style={styles.statLabel}>{t('profile.selling') || 'Selling'}</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('MyListings')}>
            <Text style={styles.statNumber}>{soldCount}</Text>
            <Text style={styles.statLabel}>{t('profile.sold') || 'Sold'}</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('MyReviews')}>
            <Text style={styles.statNumber}>{reviewCount}</Text>
            <Text style={styles.statLabel}>{t('profile.reviews') || 'Reviews'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.card}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <item.icon size={20} color="#4b5563" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutText}>{t('profile.logout') || 'Logout'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.edit_profile') || 'Edit Profile'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('profile.full_name') || 'Full Name'}</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('profile.full_name') || 'Full Name'}
            />

            <Text style={styles.inputLabel}>{t('profile.location') || 'Location'}</Text>
            <TextInput
              style={styles.input}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder={t('profile.location') || 'Location'}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>{t('common.save') || 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  screenHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16,
    marginTop: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e5e7eb' },
  profileInfo: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fullName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 13, color: '#9ca3af' },
  editBtn: { padding: 8 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ecfdf5', borderRadius: 10, padding: 12, marginTop: 14,
  },
  trustScore: { fontSize: 16, fontWeight: '700', color: '#10b981' },
  trustLevel: { flex: 1, fontSize: 13, color: '#059669' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: '#e5e7eb' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#111827',
  },
  saveBtn: {
    backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
