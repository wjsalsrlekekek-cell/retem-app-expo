import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Shield, ShoppingBag, Clock, Star, Users, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as storage from '../lib/storage';
import type { Product, Review, Post } from '../types';

interface BreakdownItem {
    icon: React.ComponentType<any>;
    label: string;
    score: number;
    max: number;
    desc: string;
    color: string;
}

export default function TrustScoreScreen() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            setLoading(true);
            const products = (await storage.getProducts()).filter((p: Product) => p.sellerId === user.id);
            const soldCount = products.filter((p: Product) => p.status === 'sold').length;
            const reviews = await storage.getReviewsByUserId(user.id);
            const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: Review) => s + r.rating, 0) / reviews.length : 0;
            const posts = await storage.getPosts();
            const userPostCount = posts.filter((p: Post) => p.authorId === user.id).length;

            setBreakdown([
                {
                    icon: Shield, label: t('trust.identity'),
                    score: user.verified ? 30 : 0, max: 30,
                    desc: user.verified ? t('trust.identity_done') : t('trust.identity_pending'),
                    color: user.verified ? '#10b981' : '#f59e0b',
                },
                {
                    icon: ShoppingBag, label: t('trust.transactions'),
                    score: Math.min(soldCount * 10, 30), max: 30,
                    desc: t('trust.transactions_desc'),
                    color: '#3b82f6',
                },
                {
                    icon: Clock, label: t('trust.response'),
                    score: 15, max: 20,
                    desc: t('trust.response_desc'),
                    color: '#8b5cf6',
                },
                {
                    icon: Star, label: t('trust.rating'),
                    score: Math.min(Math.round(avgRating * 4), 20), max: 20,
                    desc: t('trust.rating_desc'),
                    color: '#f59e0b',
                },
                {
                    icon: Users, label: t('trust.communication'),
                    score: Math.min(userPostCount * 5, 20), max: 20,
                    desc: t('trust.community_desc'),
                    color: '#ec4899',
                },
            ]);
            setLoading(false);
        };
        loadData();
    }, [user, t]);

    const trustLevel = useMemo(() => {
        if (!user) return { label: '', color: '', bg: '' };
        if (user.trustScore >= 300) return { label: t('trust.level.outstanding'), color: '#7c3aed', bg: '#ede9fe' };
        if (user.trustScore >= 200) return { label: t('trust.level.excellent'), color: '#059669', bg: '#d1fae5' };
        if (user.trustScore >= 100) return { label: t('trust.level.good'), color: '#2563eb', bg: '#dbeafe' };
        return { label: t('trust.level.fair'), color: '#d97706', bg: '#fef3c7' };
    }, [user, t]);

    const tips = [
        { text: t('trust.tip_verify'), done: user?.verified },
        { text: t('trust.tip_trade'), done: false },
        { text: t('trust.tip_review'), done: false },
        { text: t('trust.tip_respond'), done: false },
        { text: t('trust.tip_community'), done: false },
    ];

    if (!user) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('trust.title')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Score overview */}
                <View style={[styles.scoreOverview, { backgroundColor: trustLevel.bg, borderColor: trustLevel.bg }]}>
                    <Text style={[styles.scoreNumber, { color: trustLevel.color }]}>
                        {user.trustScore}
                    </Text>
                    <View style={[styles.levelBadge, { backgroundColor: trustLevel.bg }]}>
                        <Shield size={14} color={trustLevel.color} />
                        <Text style={[styles.levelText, { color: trustLevel.color }]}>
                            {trustLevel.label}
                        </Text>
                    </View>
                </View>

                {/* Breakdown */}
                <Text style={styles.sectionLabel}>{t('trust.breakdown')}</Text>
                <View style={styles.breakdownList}>
                    {breakdown.map((item, i) => {
                        const Icon = item.icon;
                        const pct = item.max > 0 ? (item.score / item.max) * 100 : 0;
                        return (
                            <View key={i} style={styles.breakdownCard}>
                                <View style={styles.breakdownHeader}>
                                    <View style={[styles.breakdownIconWrap, { backgroundColor: item.color + '15' }]}>
                                        <Icon size={16} color={item.color} />
                                    </View>
                                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                                    <Text style={[styles.breakdownScore, { color: item.color }]}>
                                        {item.score}/{item.max}
                                    </Text>
                                </View>
                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                                </View>
                                <Text style={styles.breakdownDesc}>{item.desc}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Tips */}
                <View style={styles.tipsHeader}>
                    <Lightbulb size={16} color="#f59e0b" />
                    <Text style={styles.sectionLabel}>{t('trust.improve')}</Text>
                </View>
                <View style={styles.tipsList}>
                    {tips.map((tip, i) => (
                        <View
                            key={i}
                            style={[
                                styles.tipItem,
                                {
                                    backgroundColor: tip.done ? '#f0fdf4' : '#fafafa',
                                    borderColor: tip.done ? '#d1fae5' : '#f1f5f9',
                                },
                            ]}
                        >
                            {tip.done
                                ? <CheckCircle size={16} color="#10b981" />
                                : <AlertCircle size={16} color="#94a3b8" />}
                            <Text
                                style={[
                                    styles.tipText,
                                    {
                                        color: tip.done ? '#059669' : '#64748b',
                                        fontWeight: tip.done ? '600' : '400',
                                        textDecorationLine: tip.done ? 'line-through' : 'none',
                                    },
                                ]}
                            >
                                {tip.text}
                            </Text>
                        </View>
                    ))}
                </View>
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
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    scoreOverview: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 20,
    },
    scoreNumber: {
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: -1,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginTop: 6,
    },
    levelText: {
        fontWeight: '700',
        fontSize: 13,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 12,
    },
    breakdownList: {
        gap: 10,
        marginBottom: 24,
    },
    breakdownCard: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    breakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    breakdownIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    breakdownLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    breakdownScore: {
        fontSize: 13,
        fontWeight: '700',
    },
    progressBg: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    breakdownDesc: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 6,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    tipsList: {
        gap: 8,
        marginBottom: 20,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    tipText: {
        fontSize: 12,
    },
});
