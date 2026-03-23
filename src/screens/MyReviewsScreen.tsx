import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as storage from '../lib/storage';
import type { Review, User, Product } from '../types';

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
}

interface ReviewWithDetails extends Review {
    reviewer: User | null;
    product: Product | null;
}

export default function MyReviewsScreen() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadReviews = async () => {
            setLoading(true);
            const rawReviews = await storage.getReviewsByUserId(user.id);
            const sorted = rawReviews.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const allProducts = await storage.getProducts();
            const withDetails: ReviewWithDetails[] = await Promise.all(
                sorted.map(async (review) => {
                    const reviewer = await storage.getUserById(review.reviewerId);
                    const product = allProducts.find(p => p.id === review.productId) ?? null;
                    return { ...review, reviewer, product };
                })
            );
            setReviews(withDetails);
            setLoading(false);
        };
        loadReviews();
    }, [user]);

    const avgRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }, [reviews]);

    if (!user) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('reviews.title')}</Text>
                <Text style={styles.count}>{reviews.length}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t('common.loading')}</Text>
                    </View>
                ) : (
                    <>
                        {/* Rating summary */}
                        {reviews.length > 0 && (
                            <View style={styles.ratingSummary}>
                                <Text style={styles.ratingNumber}>{avgRating.toFixed(1)}</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star
                                            key={s}
                                            size={18}
                                            color="#f59e0b"
                                            fill={s <= Math.round(avgRating) ? '#f59e0b' : 'none'}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.ratingCount}>
                                    {reviews.length} {t('reviews.title').toLowerCase()}
                                </Text>
                            </View>
                        )}

                        {reviews.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconWrap}>
                                    <MessageSquare size={32} color="#f59e0b" />
                                </View>
                                <Text style={styles.emptyTitle}>{t('reviews.empty')}</Text>
                                <Text style={styles.emptyDesc}>{t('reviews.empty_desc')}</Text>
                            </View>
                        ) : (
                            <View style={styles.reviewList}>
                                {reviews.map(review => {
                                    const timeAgoStr = getTimeAgo(review.createdAt);
                                    return (
                                        <View key={review.id} style={styles.reviewCard}>
                                            <View style={styles.reviewHeader}>
                                                <Image
                                                    source={{ uri: review.reviewer?.profileImage || 'https://via.placeholder.com/36' }}
                                                    style={styles.reviewerAvatar}
                                                />
                                                <View style={styles.reviewerInfo}>
                                                    <Text style={styles.reviewerName}>
                                                        {review.reviewer?.fullName ?? t('reviews.anonymous')}
                                                    </Text>
                                                    <View style={styles.ratingRow}>
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star
                                                                key={s}
                                                                size={12}
                                                                color="#f59e0b"
                                                                fill={s <= review.rating ? '#f59e0b' : 'none'}
                                                            />
                                                        ))}
                                                        <Text style={styles.timeAgo}>{timeAgoStr}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <Text style={styles.reviewComment}>{review.comment}</Text>
                                            {review.product && (
                                                <TouchableOpacity
                                                    onPress={() => navigation.navigate('HomeTab', {
                                                        screen: 'ProductDetail',
                                                        params: { productId: review.product!.id },
                                                    })}
                                                    style={styles.productLink}
                                                >
                                                    <Image
                                                        source={{ uri: review.product.images[0] || '' }}
                                                        style={styles.productThumb}
                                                    />
                                                    <Text style={styles.productLinkText} numberOfLines={1}>
                                                        {review.product.title}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
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
    ratingSummary: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fef3c7',
        marginBottom: 20,
    },
    ratingNumber: {
        fontSize: 40,
        fontWeight: '800',
        color: '#f59e0b',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 3,
        marginTop: 4,
        marginBottom: 6,
    },
    ratingCount: {
        fontSize: 12,
        color: '#94a3b8',
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
        backgroundColor: '#fef3c7',
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
        lineHeight: 20,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    reviewList: {
        gap: 10,
    },
    reviewCard: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    reviewerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    reviewerInfo: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeAgo: {
        fontSize: 11,
        color: '#94a3b8',
        marginLeft: 4,
    },
    reviewComment: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
    },
    productLink: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    productThumb: {
        width: 24,
        height: 24,
        borderRadius: 4,
    },
    productLinkText: {
        fontSize: 11,
        color: '#64748b',
        flex: 1,
    },
});
