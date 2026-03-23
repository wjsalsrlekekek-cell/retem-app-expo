import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Product, Chat, Message, Notification } from '../types';

// Helper to generate unique IDs without crypto.randomUUID (not available in RN)
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helpers for AsyncStorage
async function getAS(key: string): Promise<any[]> {
    try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function setAS(key: string, val: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(val));
}

export const COLLECTION_USERS = 'retem_users';
export const COLLECTION_PRODUCTS = 'retem_products';
export const COLLECTION_CHATS = 'retem_chats';
export const COLLECTION_MESSAGES = 'retem_messages';
export const COLLECTION_NOTIFICATIONS = 'retem_notifications';

// --- Users ---
export async function fetchUser(uid: string): Promise<User | null> {
    const users = await getAS(COLLECTION_USERS);
    return users.find((u: any) => u.id === uid) || null;
}

export async function createUserDoc(user: User): Promise<void> {
    const users = await getAS(COLLECTION_USERS);
    const existing = users.findIndex((u: any) => u.id === user.id);
    if (existing >= 0) users[existing] = user;
    else users.push(user);
    await setAS(COLLECTION_USERS, users);
}

export async function updateUserDoc(uid: string, data: Partial<User>): Promise<void> {
    const users = await getAS(COLLECTION_USERS);
    const idx = users.findIndex((u: any) => u.id === uid);
    if (idx >= 0) {
        users[idx] = { ...users[idx], ...data };
        await setAS(COLLECTION_USERS, users);
    }
}

// --- Products ---
export async function fetchProducts(): Promise<Product[]> {
    return await getAS(COLLECTION_PRODUCTS);
}

export async function fetchProductById(id: string): Promise<Product | null> {
    const products = await getAS(COLLECTION_PRODUCTS);
    return products.find((p: any) => p.id === id) || null;
}

export async function createProductDoc(product: Product): Promise<void> {
    const products = await getAS(COLLECTION_PRODUCTS);
    products.push(product);
    await setAS(COLLECTION_PRODUCTS, products);
}

export async function updateProductDoc(id: string, data: Partial<Product>): Promise<void> {
    const products = await getAS(COLLECTION_PRODUCTS);
    const idx = products.findIndex((p: any) => p.id === id);
    if (idx >= 0) {
        products[idx] = { ...products[idx], ...data };
        await setAS(COLLECTION_PRODUCTS, products);
    }
}

// --- Chats ---
export async function createChat(chat: Chat): Promise<void> {
    const chats = await getAS(COLLECTION_CHATS);
    if (!chats.find((c: any) => c.id === chat.id)) {
        chats.push(chat);
        await setAS(COLLECTION_CHATS, chats);
    }
}

export async function fetchUserChats(userId: string): Promise<Chat[]> {
    const chats = await getAS(COLLECTION_CHATS);
    return chats.filter((c: any) => c.buyerId === userId || c.sellerId === userId)
        .sort((a: any, b: any) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
}

export async function fetchChatById(chatId: string): Promise<Chat | null> {
    const chats = await getAS(COLLECTION_CHATS);
    return chats.find((c: any) => c.id === chatId) || null;
}

// 채팅 참여자로 기존 채팅방 찾기
export async function fetchChatByParticipants(productId: string, buyerId: string, sellerId: string): Promise<Chat | null> {
    const chats = await getAS(COLLECTION_CHATS);
    return chats.find((c: any) => c.productId === productId && c.buyerId === buyerId && c.sellerId === sellerId) || null;
}

export async function sendMessage(chatId: string, message: Message, lastMessageText: string): Promise<void> {
    // Save message to chat-specific key
    const chatMessagesKey = `retem_messages_${chatId}`;
    const chatMessages = await getAS(chatMessagesKey);
    chatMessages.push(message);
    await setAS(chatMessagesKey, chatMessages);

    // Update chat metadata
    const chats = await getAS(COLLECTION_CHATS);
    const idx = chats.findIndex((c: any) => c.id === chatId);
    if (idx >= 0) {
        chats[idx].lastMessage = lastMessageText;
        chats[idx].lastMessageAt = message.createdAt;
        await setAS(COLLECTION_CHATS, chats);
    }
}

// 폴링 방식으로 실시간 메시지 구독 (AsyncStorage 기반)
export function subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    const chatMessagesKey = `retem_messages_${chatId}`;

    // 구 방식 (retem_messages 단일 배열)에서 메시지 마이그레이션
    const migrateLegacy = async () => {
        try {
            const raw = await AsyncStorage.getItem(COLLECTION_MESSAGES);
            const all: Message[] = raw ? JSON.parse(raw) : [];
            const legacyMessages = all.filter((m: any) => m.chatId === chatId);

            if (legacyMessages.length > 0) {
                const existing = await getAS(chatMessagesKey);
                const existingIds = new Set(existing.map((m: any) => m.id));
                const toAdd = legacyMessages.filter((m: any) => !existingIds.has(m.id));
                if (toAdd.length > 0) {
                    await setAS(chatMessagesKey, [...existing, ...toAdd]);
                }
            }
        } catch {
            // ignore migration errors
        }
    };

    const loadMessages = async () => {
        const msgs = await getAS(chatMessagesKey);
        msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        callback(msgs);
    };

    // Run migration then load
    migrateLegacy().then(() => loadMessages());

    // 500ms 마다 폴링하여 실시간 업데이트 시뮬레이션
    const intervalId = setInterval(async () => {
        await loadMessages();
    }, 500);

    return () => clearInterval(intervalId);
}

// --- Notifications ---
export async function fetchNotifications(userId: string): Promise<Notification[]> {
    const notifs = await getAS(COLLECTION_NOTIFICATIONS);
    return notifs.filter((n: any) => n.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationRead(id: string): Promise<void> {
    const notifs = await getAS(COLLECTION_NOTIFICATIONS);
    const idx = notifs.findIndex((n: any) => n.id === id);
    if (idx >= 0) {
        notifs[idx].isRead = true;
        await setAS(COLLECTION_NOTIFICATIONS, notifs);
    }
}

// --- Storage ---
export async function uploadImage(_uri: string): Promise<string> {
    // Mock upload delay - in Expo we receive a URI string instead of File
    return new Promise((resolve) => {
        setTimeout(() => {
            const seed = Math.random().toString(36).substring(7);
            resolve(`https://picsum.photos/seed/${seed}/400/400`);
        }, 800);
    });
}

export { generateId };
