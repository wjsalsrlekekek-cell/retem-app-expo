import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as db from '../lib/db';
import type { Chat, User, Product } from '../types';
import type { ChatStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      setLoading(true);
      const userChats = await db.fetchUserChats(user.id);
      setChats(userChats);

      const userIds = new Set<string>();
      const productIds = new Set<string>();
      userChats.forEach((c) => {
        userIds.add(c.buyerId === user.id ? c.sellerId : c.buyerId);
        productIds.add(c.productId);
      });

      const users: Record<string, User> = {};
      const products: Record<string, Product> = {};

      await Promise.all([
        ...Array.from(userIds).map(async (uid) => {
          const u = await db.fetchUser(uid);
          if (u) users[uid] = u;
        }),
        ...Array.from(productIds).map(async (pid) => {
          const p = await db.fetchProductById(pid);
          if (p) products[pid] = p;
        }),
      ]);

      setUsersMap(users);
      setProductsMap(products);
      setLoading(false);
    };
    loadChats();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const renderChatItem = ({ item: chat }: { item: Chat }) => {
    const otherUserId = chat.buyerId === user?.id ? chat.sellerId : chat.buyerId;
    const otherUser = usersMap[otherUserId];
    const product = productsMap[chat.productId];
    const unread =
      chat.buyerId === user?.id ? chat.unreadCountBuyer : chat.unreadCountSeller;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('ChatRoom', {
            chatId: chat.id,
            otherUserName: otherUser?.fullName,
          })
        }
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: otherUser?.profileImage || 'https://via.placeholder.com/40',
            }}
            style={styles.avatar}
          />
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser?.fullName || 'Unknown User'}
            </Text>
            <Text style={styles.timestamp}>
              {chat.lastMessageAt ? timeAgo(chat.lastMessageAt) : ''}
            </Text>
          </View>
          <Text
            style={[
              styles.lastMessage,
              unread > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage || t('chat.empty_desc')}
          </Text>
          {product && (
            <Text style={styles.productLabel} numberOfLines={1}>
              {product.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('chat.title')}</Text>
      </View>

      {chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MessageCircle size={44} color="#94a3b8" style={{ opacity: 0.4 }} />
          <Text style={styles.emptyTitle}>{t('chat.empty')}</Text>
          <Text style={styles.emptyDesc}>{t('chat.empty_desc')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  chatContent: {
    flex: 1,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  timestamp: {
    fontSize: 10,
    color: '#94a3b8',
    flexShrink: 0,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  lastMessageUnread: {
    color: '#334155',
    fontWeight: '500',
  },
  productLabel: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});
