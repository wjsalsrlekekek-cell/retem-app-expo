export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'th' | 'tl' | 'id';

export type Category =
    | 'Electronics'
    | 'Fashion'
    | 'Home & Living'
    | 'Sports & Outdoors'
    | 'Books & Media'
    | 'Furniture'
    | 'Toys & Games'
    | 'Beauty & Health'
    | 'Others';

export type Condition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    profileImage: string;
    language: string;
    location: string;
    verified: boolean;
    verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
    trustScore: number;
    authProvider: 'email' | 'google';
    isActive: boolean;
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    condition: string;
    location: string;
    images: string[];
    dealTypes: string[];
    views: number;
    likes: number;
    status: 'active' | 'reserved' | 'sold' | 'deleted';
    createdAt: string;
    updatedAt: string;
}

export interface Chat {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCountBuyer: number;
    unreadCountSeller: number;
    createdAt: string;
}

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    messageType: 'text' | 'image' | 'offer' | 'system';
    content: string;
    isRead: boolean;
    createdAt: string;
}

export interface Review {
    id: string;
    reviewerId: string;
    revieweeId: string;
    productId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface Post {
    id: string;
    authorId: string;
    content: string;
    images: string[];
    tags: string[];
    likes: number;
    commentsCount: number;
    language: string;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: string;
}

export interface OfferContent {
    originalPrice: number;
    offerPrice: number;
    status: 'pending' | 'accepted' | 'rejected';
}

export interface Notification {
    id: string;
    userId: string;
    type: 'message' | 'like' | 'offer' | 'review' | 'system';
    title: string;
    body: string;
    relatedId: string;
    isRead: boolean;
    createdAt: string;
}
