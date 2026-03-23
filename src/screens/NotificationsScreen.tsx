import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Bell, MessageCircle, Heart, Tag, Star, AlertCircle, Package } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as db from '../lib/db';
import type { Notification } from '../types';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

const iconMap: Record<string, React.ComponentType<any>> = {
    message: MessageCircle,
    offer: Tag,
    like: Heart,
    sold: Package,
    review: Star,
    system: AlertCircle,
};

const colorMap: Record<string, string> = {
    message: '#10b981',
    offer: '#f59e0b',
    like: '#ef4444',
    sold: '#2563eb',
    review: '#8b5cf6',
    system: '#64748b',
};

const bgMap: Record<string, string> = {
    message: '#d1fae5',
    offer: '#fef3c7',
    like: '#fee2e2',
    sold: '#dbeafe',
    review: '#ede9fe',
    system: '#f1f5f9',
};

export default function NotificationsScreen() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadNotifs = async () => {
            setLoading(true);
            const data = await db.fetchNotifications(user.id);
            setNotifications(data);
            setLoading(false);
        };
        loadNotifs();
    }, [user]);

    const handlePress = async (notif: Notification) => {
        if (!notif.isRead) {
            await db.markNotificationRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        }

        if (notif.type === 'message' || notif.type === 'offer') {
            navigation.navigate('ChatTab', {
                screen: 'ChatRoom',
                params: { chatId: notif.relatedId },
            });
        } else if (notif.type === 'like') {
            navigation.navigate('HomeTab', {
                screen: 'ProductDetail',
                params: { productId: notif.relatedId },
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>{t('common.loading')}</Text>
                    </View>
                ) : notifications.length > 0 ? (
                    notifications.map(notif => {
                        const Icon = iconMap[notif.type] ?? Bell;
                        return (
                            <TouchableOpacity
                                key={notif.id}
                                onPress={() => handlePress(notif)}
                                style={[
                                    styles.notifCard,
                                    { backgroundColor: notif.isRead ? '#ffffff' : '#f0fdf4' },
                                ]}
                            >
                                <View style={[styles.notifIconWrap, { backgroundColor: bgMap[notif.type] ?? '#f1f5f9' }]}>
                                    <Icon size={18} color={colorMap[notif.type] ?? '#64748b'} />
                                </View>
                                <View style={styles.notifContent}>
                                    <Text style={[styles.notifTitle, { fontWeight: notif.isRead ? '400' : '600' }]}>
                                        {notif.title}
                                    </Text>
                                    <Text style={styles.notifBody}>{notif.body}</Text>
                                    <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
                                </View>
                                {!notif.isRead && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyContainer}>
                        <Bell size={48} color="#94a3b8" style={{ opacity: 0.5 }} />
                        <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
                        <Text style={styles.emptyDesc}>{t('notifications.empty_desc')}</Text>
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
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    notifCard: {
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 8,
    },
    notifIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 14,
        color: '#334155',
    },
    notifBody: {
        fontSize: 13,
        color: '#64748b',
    },
    notifTime: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginTop: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontWeight: '600',
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 12,
    },
    emptyDesc: {
        fontSize: 14,
        color: '#94a3b8',
    },
});
