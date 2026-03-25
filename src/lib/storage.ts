import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Product, Notification, Post, Comment, Review } from '../types';

// --- Seeding ---
// Seeding is no longer needed with Firebase — data lives in the cloud.
// These functions are kept as no-ops for backward compatibility with App.tsx.
export async function isSeeded(): Promise<boolean> {
  return true; // Always return true to skip seeding
}

export async function markSeeded(): Promise<void> {
  // no-op
}

// --- Users ---
export async function getUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
}

export async function setUsers(_users: User[]): Promise<void> {
  // Batch writes — not typically needed with Firebase
  // Individual user updates via updateUser are preferred
}

export async function getUserById(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: new Date().toISOString() });
}

// --- Products ---
export async function getProducts(): Promise<Product[]> {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function setProducts(_products: Product[]): Promise<void> {
  // no-op — individual updates preferred
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', productId), { ...data, updatedAt: new Date().toISOString() });
}

// --- Chats ---
export async function getChats(): Promise<any[]> {
  const snap = await getDocs(collection(db, 'chats'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- Notifications ---
export async function getNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snap = await getDocs(q);
  return snap.size;
}

// --- Favorites ---
// Stored as individual docs in a 'favorites' collection with composite key
function favDocId(userId: string, productId: string): string {
  return `${userId}_${productId}`;
}

export async function getFavorites(userId: string): Promise<string[]> {
  const q = query(collection(db, 'favorites'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().productId as string);
}

export async function addFavorite(userId: string, productId: string): Promise<void> {
  await setDoc(doc(db, 'favorites', favDocId(userId, productId)), {
    userId,
    productId,
    createdAt: new Date().toISOString(),
  });
}

export async function removeFavorite(userId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, 'favorites', favDocId(userId, productId)));
}

export async function isFavorite(userId: string, productId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'favorites', favDocId(userId, productId)));
  return snap.exists();
}

export async function getUserFavorites(userId: string): Promise<string[]> {
  return getFavorites(userId);
}

export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  try {
    if (await isFavorite(userId, productId)) {
      await removeFavorite(userId, productId);
      return false;
    } else {
      await addFavorite(userId, productId);
      return true;
    }
  } catch (error) {
    console.error('toggleFavorite error:', error);
    throw error;
  }
}

// --- Reviews ---
export async function getReviewsByUserId(userId: string): Promise<Review[]> {
  const q = query(collection(db, 'reviews'), where('revieweeId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
}

export async function addReview(review: Review): Promise<void> {
  const { id, ...data } = review;
  await setDoc(doc(db, 'reviews', id), data);
}

export async function hasReviewForProduct(reviewerId: string, productId: string): Promise<boolean> {
  const q = query(
    collection(db, 'reviews'),
    where('reviewerId', '==', reviewerId),
    where('productId', '==', productId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// --- Posts ---
export async function getPosts(): Promise<Post[]> {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
}

export async function setPosts(_posts: Post[]): Promise<void> {
  // no-op
}

export async function addPost(post: Post): Promise<void> {
  const { id, ...data } = post;
  await setDoc(doc(db, 'posts', id), data);
}

export async function updatePost(postId: string, data: Partial<Post>): Promise<void> {
  await updateDoc(doc(db, 'posts', postId), { ...data, updatedAt: new Date().toISOString() });
}

// --- Comments ---
export async function getComments(): Promise<Comment[]> {
  const snap = await getDocs(collection(db, 'comments'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
}

export async function addComment(comment: Comment): Promise<void> {
  const { id, ...data } = comment;
  await setDoc(doc(db, 'comments', id), data);
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const q = query(collection(db, 'comments'), where('postId', '==', postId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
}

// --- Post Likes ---
function likeDocId(userId: string, postId: string): string {
  return `${userId}_${postId}`;
}

export async function getPostLikes(userId: string): Promise<string[]> {
  const q = query(collection(db, 'postLikes'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().postId as string);
}

export async function isPostLiked(userId: string, postId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'postLikes', likeDocId(userId, postId)));
  return snap.exists();
}

export async function togglePostLike(userId: string, postId: string): Promise<void> {
  const liked = await isPostLiked(userId, postId);
  const postRef = doc(db, 'posts', postId);
  const likeRef = doc(db, 'postLikes', likeDocId(userId, postId));

  if (liked) {
    await deleteDoc(likeRef);
    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      if (postSnap.exists()) {
        const currentLikes = (postSnap.data() as Post).likes ?? 0;
        transaction.update(postRef, { likes: Math.max(0, currentLikes - 1) });
      }
    });
  } else {
    await setDoc(likeRef, {
      userId,
      postId,
      createdAt: new Date().toISOString(),
    });
    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      if (postSnap.exists()) {
        const currentLikes = (postSnap.data() as Post).likes ?? 0;
        transaction.update(postRef, { likes: currentLikes + 1 });
      }
    });
  }
}

// --- UUID ---
export function uuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
