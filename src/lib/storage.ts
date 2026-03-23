import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Product, Notification, Post, Comment, Review } from '../types';

const SEED_KEY = 'retem_seeded';

export async function isSeeded(): Promise<boolean> {
    const val = await AsyncStorage.getItem(SEED_KEY);
    return val === 'true';
}

export async function markSeeded(): Promise<void> {
    await AsyncStorage.setItem(SEED_KEY, 'true');
}

// --- Helper for safe JSON parse ---
async function getItem<T>(key: string, fallback: T): Promise<T> {
    try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

// --- Users ---
export async function getUsers(): Promise<User[]> {
    return getItem<User[]>('retem_users', []);
}

export async function setUsers(users: User[]): Promise<void> {
    await AsyncStorage.setItem('retem_users', JSON.stringify(users));
}

// --- Products ---
export async function getProducts(): Promise<Product[]> {
    return getItem<Product[]>('retem_products', []);
}

export async function setProducts(products: Product[]): Promise<void> {
    await AsyncStorage.setItem('retem_products', JSON.stringify(products));
}

// --- Chats ---
export async function getChats(): Promise<any[]> {
    return getItem<any[]>('retem_chats', []);
}

// --- Notifications ---
export async function getNotifications(userId: string): Promise<Notification[]> {
    const all = await getItem<Notification[]>('retem_notifications', []);
    return all.filter(n => n.userId === userId);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const notifs = await getNotifications(userId);
    return notifs.filter(n => !n.isRead).length;
}

// --- Favorites ---
export async function getFavorites(userId: string): Promise<string[]> {
    return getItem<string[]>(`retem_favorites_${userId}`, []);
}

export async function addFavorite(userId: string, productId: string): Promise<void> {
    const favs = await getFavorites(userId);
    if (!favs.includes(productId)) {
        favs.push(productId);
        await AsyncStorage.setItem(`retem_favorites_${userId}`, JSON.stringify(favs));
    }
}

export async function removeFavorite(userId: string, productId: string): Promise<void> {
    const favs = (await getFavorites(userId)).filter(id => id !== productId);
    await AsyncStorage.setItem(`retem_favorites_${userId}`, JSON.stringify(favs));
}

export async function isFavorite(userId: string, productId: string): Promise<boolean> {
    const favs = await getFavorites(userId);
    return favs.includes(productId);
}

// --- User Update ---
export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
        users[idx] = { ...users[idx], ...data };
        await setUsers(users);
    }
}

// --- User Lookup ---
export async function getUserById(userId: string): Promise<User | null> {
    const users = await getUsers();
    return users.find(u => u.id === userId) || null;
}

// --- Favorites (alias) ---
export async function getUserFavorites(userId: string): Promise<string[]> {
    return getFavorites(userId);
}

// --- Favorite Toggle ---
export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
    if (await isFavorite(userId, productId)) {
        await removeFavorite(userId, productId);
        return false;
    } else {
        await addFavorite(userId, productId);
        return true;
    }
}

// --- Product Update ---
export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
    const products = await getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx >= 0) {
        products[idx] = { ...products[idx], ...data };
        await setProducts(products);
    }
}

// --- Reviews ---
export async function getReviewsByUserId(userId: string): Promise<Review[]> {
    const all = await getItem<Review[]>('retem_reviews', []);
    return all.filter(r => r.revieweeId === userId);
}

export async function addReview(review: Review): Promise<void> {
    const reviews = await getItem<Review[]>('retem_reviews', []);
    reviews.push(review);
    await AsyncStorage.setItem('retem_reviews', JSON.stringify(reviews));
}

export async function hasReviewForProduct(reviewerId: string, productId: string): Promise<boolean> {
    const reviews = await getItem<Review[]>('retem_reviews', []);
    return reviews.some(r => r.reviewerId === reviewerId && r.productId === productId);
}

// --- Posts ---
export async function getPosts(): Promise<Post[]> {
    return getItem<Post[]>('retem_posts', []);
}

export async function setPosts(posts: Post[]): Promise<void> {
    await AsyncStorage.setItem('retem_posts', JSON.stringify(posts));
}

export async function addPost(post: Post): Promise<void> {
    const posts = await getPosts();
    posts.push(post);
    await setPosts(posts);
}

export async function updatePost(postId: string, data: Partial<Post>): Promise<void> {
    const posts = await getPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx >= 0) {
        posts[idx] = { ...posts[idx], ...data };
        await setPosts(posts);
    }
}

// --- Comments ---
export async function getComments(): Promise<Comment[]> {
    return getItem<Comment[]>('retem_comments', []);
}

export async function addComment(comment: Comment): Promise<void> {
    const comments = await getComments();
    comments.push(comment);
    await AsyncStorage.setItem('retem_comments', JSON.stringify(comments));
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
    const comments = await getComments();
    return comments.filter(c => c.postId === postId);
}

// --- Post Likes ---
export async function getPostLikes(userId: string): Promise<string[]> {
    return getItem<string[]>(`retem_post_likes_${userId}`, []);
}

export async function isPostLiked(userId: string, postId: string): Promise<boolean> {
    const likes = await getPostLikes(userId);
    return likes.includes(postId);
}

export async function togglePostLike(userId: string, postId: string): Promise<void> {
    const likes = await getPostLikes(userId);
    const posts = await getPosts();
    const postIdx = posts.findIndex(p => p.id === postId);

    if (likes.includes(postId)) {
        await AsyncStorage.setItem(`retem_post_likes_${userId}`, JSON.stringify(likes.filter(id => id !== postId)));
        if (postIdx >= 0) { posts[postIdx].likes = Math.max(0, posts[postIdx].likes - 1); await setPosts(posts); }
    } else {
        likes.push(postId);
        await AsyncStorage.setItem(`retem_post_likes_${userId}`, JSON.stringify(likes));
        if (postIdx >= 0) { posts[postIdx].likes += 1; await setPosts(posts); }
    }
}

// --- UUID ---
export function uuid(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
