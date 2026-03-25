import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { User, Product, Chat, Message, Notification } from '../types';

export type { Notification };

// Helper to generate unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// --- Users ---
export async function fetchUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

export async function createUserDoc(user: User): Promise<void> {
  const { id, ...data } = user;
  await setDoc(doc(db, 'users', id), data);
}

export async function updateUserDoc(uid: string, data: Partial<User>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, { ...data, updatedAt: new Date().toISOString() });
  }
}

// --- Products ---
export async function fetchProducts(): Promise<Product[]> {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function createProductDoc(product: Product): Promise<void> {
  const { id, ...data } = product;
  await setDoc(doc(db, 'products', id), data);
}

export async function updateProductDoc(id: string, data: Partial<Product>): Promise<void> {
  const productRef = doc(db, 'products', id);
  await updateDoc(productRef, { ...data, updatedAt: new Date().toISOString() });
}

// --- Chats ---
export async function createChat(chat: Chat): Promise<void> {
  const chatRef = doc(db, 'chats', chat.id);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    const { id, ...data } = chat;
    await setDoc(chatRef, data);
  }
}

export async function fetchUserChats(userId: string): Promise<Chat[]> {
  // Firestore doesn't support OR queries across different fields easily,
  // so we do two queries and merge
  const buyerQ = query(collection(db, 'chats'), where('buyerId', '==', userId));
  const sellerQ = query(collection(db, 'chats'), where('sellerId', '==', userId));

  const [buyerSnap, sellerSnap] = await Promise.all([getDocs(buyerQ), getDocs(sellerQ)]);

  const chatMap = new Map<string, Chat>();
  for (const d of buyerSnap.docs) {
    chatMap.set(d.id, { id: d.id, ...d.data() } as Chat);
  }
  for (const d of sellerSnap.docs) {
    chatMap.set(d.id, { id: d.id, ...d.data() } as Chat);
  }

  return Array.from(chatMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  );
}

export async function fetchChatById(chatId: string): Promise<Chat | null> {
  const snap = await getDoc(doc(db, 'chats', chatId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Chat;
}

export async function fetchChatByParticipants(
  productId: string,
  buyerId: string,
  sellerId: string
): Promise<Chat | null> {
  const q = query(
    collection(db, 'chats'),
    where('productId', '==', productId),
    where('buyerId', '==', buyerId),
    where('sellerId', '==', sellerId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Chat;
}

export async function sendMessage(
  chatId: string,
  message: Message,
  lastMessageText: string
): Promise<void> {
  // Save message to subcollection
  const { id, ...msgData } = message;
  await setDoc(doc(db, 'chats', chatId, 'messages', id), msgData);

  // Update chat metadata
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: lastMessageText,
    lastMessageAt: message.createdAt,
  });
}

// Real-time message subscription using Firestore onSnapshot
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    callback(messages);
  });

  return unsubscribe;
}

// --- Notifications ---
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { isRead: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
  await Promise.all(updates);
}

export async function createNotification(notif: Notification): Promise<void> {
  const { id, ...data } = notif;
  await setDoc(doc(db, 'notifications', id), data);
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snap = await getDocs(q);
  return snap.size;
}

export function subscribeToUnreadNotifications(
  userId: string,
  callback: (count: number) => void,
): () => void {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.size);
  });
}

// --- Storage (Image Upload) ---
export async function uploadImage(
  uri: string,
  path: string = 'products'
): Promise<string> {
  try {
    // Fetch the image as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename
    const filename = `${path}/${generateId()}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    // Fallback to local URI if Storage is not yet activated
    return uri;
  }
}

// --- Firestore message update (for offer status) ---
export async function updateMessage(
  chatId: string,
  messageId: string,
  data: Partial<Message>
): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, data);
}
