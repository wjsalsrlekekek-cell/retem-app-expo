import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as storage from '../lib/storage';
import type { Product, User } from '../types';

interface FavoriteProduct extends Product {
    seller?: User | null;
}

export default function FavoritesScreen() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadFavorites = async () => {
            setLoading(true);
            const favIds = await storage.getUserFavorites(user.id);
            const allProducts = await storage.getProducts();
            const filtered = allProducts.filter(p => favIds.includes(p.id) && p.status !== 'deleted');
            const withSellers: FavoriteProduct[] = await Promise.all(
                filtered.map(async (p) => {
                    const seller = await storage.getUserById(p.sellerId);
                    return { ...p, seller };
                })
            );
            setFavoriteProducts(withSellers);
            setLoading(false);
        };
        loadFavorites();
    }, [user]);

    if (!user) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.favorites')}</Text>
                <Text style={styles.count}>{favoriteProducts.length}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t('common.loading')}</Text>
                    </View>
                ) : favoriteProducts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrap}>
                            <Heart size={32} color="#f87171" />
                        </View>
                        <Text style={styles.emptyTitle}>{t('empty.no_favorites')}</Text>
                        <Text style={styles.emptyDesc}>{t('empty.no_favorites_desc')}</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('HomeTab')}
                            style={styles.browseButton}
                        >
                            <ShoppingBag size={16} color="#ffffff" />
                            <Text style={styles.browseButtonText}>{t('favorites.browse')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.productList}>
                        {favoriteProducts.map(product => (
                            <TouchableOpacity
                                key={product.id}
                                onPress={() => navigation.navigate('HomeTab', {
                                    screen: 'ProductDetail',
                                    params: { productId: product.id },
                                })}
                                style={styles.productItem}
                            >
                                <Image
                                    source={{ uri: product.images[0] || 'https://via.placeholder.com/80' }}
                                    style={styles.productImage}
                                />
                                <View style={styles.productInfo}>
                                    <Text style={styles.productTitle} numberOfLines={1}>
                                        {product.title}
                                    </Text>
                                    <Text style={styles.productPrice}>
                                        {product.currency} {product.price.toLocaleString()}
                                    </Text>
                                    <Text style={styles.productMeta}>
                                        {product.seller?.fullName} {'\u00B7'} {product.location}
                                    </Text>
                                </View>
                                <Heart size={18} color="#ef4444" fill="#ef4444" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    count: {
        fontSize: 13,
        color: '#10b981',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 6,
    },
    emptyDesc: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 20,
        lineHeight: 20,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    browseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    browseButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    productList: {
        gap: 10,
    },
    productItem: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },
    productInfo: {
        flex: 1,
    },
    productTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#10b981',
        marginBottom: 4,
    },
    productMeta: {
        fontSize: 11,
        color: '#94a3b8',
    },
});
