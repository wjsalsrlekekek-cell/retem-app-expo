import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { User, Product, Chat, Message, Review, Post, Comment, Notification } from '../types';
import * as storage from '../lib/storage';

const SAMPLE_USERS: User[] = [
    {
        id: 'user-1', email: 'sarah@example.com', passwordHash: 'Test1234', fullName: 'Sarah Kim',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', language: 'en',
        location: 'Gangnam, Seoul', verified: true, verificationStatus: 'approved', trustScore: 85,
        authProvider: 'email', isActive: true, lastLoginAt: '2025-02-12T10:00:00Z',
        createdAt: '2024-11-01T00:00:00Z', updatedAt: '2025-02-12T10:00:00Z',
    },
    {
        id: 'user-2', email: 'james@example.com', passwordHash: 'Test1234', fullName: 'James Lee',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', language: 'en',
        location: 'Itaewon, Seoul', verified: true, verificationStatus: 'approved', trustScore: 120,
        authProvider: 'email', isActive: true, lastLoginAt: '2025-02-11T14:00:00Z',
        createdAt: '2024-10-15T00:00:00Z', updatedAt: '2025-02-11T14:00:00Z',
    },
    {
        id: 'user-3', email: 'maria@example.com', passwordHash: 'Test1234', fullName: 'Maria Santos',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', language: 'tl',
        location: 'Hongdae, Seoul', verified: false, verificationStatus: 'none', trustScore: 25,
        authProvider: 'email', isActive: true, lastLoginAt: '2025-02-10T08:00:00Z',
        createdAt: '2025-01-05T00:00:00Z', updatedAt: '2025-02-10T08:00:00Z',
    },
    {
        id: 'user-4', email: 'nguyen@example.com', passwordHash: 'Test1234', fullName: 'Nguyen Van',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nguyen', language: 'vi',
        location: 'Mapo, Seoul', verified: true, verificationStatus: 'approved', trustScore: 155,
        authProvider: 'google', isActive: true, lastLoginAt: '2025-02-12T09:00:00Z',
        createdAt: '2024-09-20T00:00:00Z', updatedAt: '2025-02-12T09:00:00Z',
    },
    {
        id: 'user-5', email: 'yuki@example.com', passwordHash: 'Test1234', fullName: 'Yuki Tanaka',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki', language: 'ja',
        location: 'Sinchon, Seoul', verified: true, verificationStatus: 'approved', trustScore: 95,
        authProvider: 'email', isActive: true, lastLoginAt: '2025-02-11T16:00:00Z',
        createdAt: '2024-12-01T00:00:00Z', updatedAt: '2025-02-11T16:00:00Z',
    },
];

const unsplashIds = [
    'photo-1517336714731-489689fd1ca8', // macbook
    'photo-1555041469-a586c61ea9bc', // sofa
    'photo-1542291026-7eec264c27ff', // shoes
    'photo-1518455027359-f3f8164ba6bd', // desk
    'photo-1523275335684-37898b6baf30', // watch
    'photo-1526170375885-4d8ecf77b99f', // camera
    'photo-1585386959984-a4155224a1ad', // headphones
    'photo-1593642632559-0c6d3fc62b89', // phone
    'photo-1555664424-778a1e5e1b48', // keyboard
    'photo-1560343090-f0409e92791a', // bag
    'photo-1505740420928-5e560c06d30e', // earbuds
    'photo-1491553895911-0055eca6402d', // sneakers
    'photo-1586023492125-27b2c045efd7', // bed
    'photo-1618220179428-22790b461013', // living room
    'photo-1567538096621-38d2284b23ff', // shoes2
    'photo-1611186871348-b1ce696e52c9', // ps5
    'photo-1585386959984-a4155224a1ad', // headphones2
    'photo-1496181133206-80ce9b88a853', // laptop
    'photo-1550009158-9ebf69173e03', // bicycle
    'photo-1533090161767-e6ffed986c88', // furniture
];

const SAMPLE_PRODUCTS: Product[] = [
    { id: 'prod-1', sellerId: 'user-1', title: 'MacBook Pro 2023 16-inch M3', description: 'Barely used MacBook Pro with M3 chip. Perfect condition, comes with original charger and box. Selling because I upgraded to a newer model.', price: 1200000, currency: 'KRW', category: 'Electronics', condition: 'Like New', location: 'Gangnam, Seoul', images: [`https://images.unsplash.com/${unsplashIds[0]}?w=400`], dealTypes: ['direct', 'parcel'], views: 124, likes: 8, status: 'active', createdAt: '2025-02-12T10:00:00Z', updatedAt: '2025-02-12T10:00:00Z' },
    { id: 'prod-2', sellerId: 'user-2', title: 'IKEA MALM Desk - White', description: 'IKEA desk in good condition. Some minor scratches on the surface but fully functional. Must pick up from Itaewon.', price: 80000, currency: 'KRW', category: 'Furniture', condition: 'Good', location: 'Itaewon, Seoul', images: [`https://images.unsplash.com/${unsplashIds[3]}?w=400`], dealTypes: ['direct'], views: 56, likes: 3, status: 'active', createdAt: '2025-02-12T05:00:00Z', updatedAt: '2025-02-12T05:00:00Z' },
    { id: 'prod-3', sellerId: 'user-1', title: 'Nike Air Max 90 - Size 270', description: 'Brand new Nike Air Max 90 sneakers. White/Black colorway. Size 270mm. Never worn, still in original box.', price: 95000, currency: 'KRW', category: 'Fashion', condition: 'New', location: 'Gangnam, Seoul', images: [`https://images.unsplash.com/${unsplashIds[2]}?w=400`], dealTypes: ['direct', 'parcel'], views: 89, likes: 12, status: 'active', createdAt: '2025-02-11T14:00:00Z', updatedAt: '2025-02-11T14:00:00Z' },
    { id: 'prod-4', sellerId: 'user-3', title: 'Sony WH-1000XM5 Headphones', description: 'Excellent noise-canceling headphones. Used for 3 months. Comes with carry case and all cables. Battery life is still great.', price: 180000, currency: 'KRW', category: 'Electronics', condition: 'Like New', location: 'Hongdae, Seoul', images: [`https://images.unsplash.com/${unsplashIds[6]}?w=400`], dealTypes: ['direct', 'parcel'], views: 203, likes: 24, status: 'active', createdAt: '2025-02-11T09:00:00Z', updatedAt: '2025-02-11T09:00:00Z' },
    { id: 'prod-5', sellerId: 'user-4', title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Samsung flagship phone in perfect condition. Phantom Black color. Comes with S-Pen, case, and screen protector already applied.', price: 850000, currency: 'KRW', category: 'Electronics', condition: 'Like New', location: 'Mapo, Seoul', images: [`https://images.unsplash.com/${unsplashIds[7]}?w=400`], dealTypes: ['direct', 'parcel'], views: 312, likes: 35, status: 'active', createdAt: '2025-02-10T16:00:00Z', updatedAt: '2025-02-10T16:00:00Z' },
    { id: 'prod-6', sellerId: 'user-5', title: 'Canon EOS R50 Camera Kit', description: 'Mirrorless camera with 18-45mm lens kit. Perfect for beginners and content creators. Shutter count under 5000.', price: 650000, currency: 'KRW', category: 'Electronics', condition: 'Good', location: 'Sinchon, Seoul', images: [`https://images.unsplash.com/${unsplashIds[5]}?w=400`], dealTypes: ['direct'], views: 87, likes: 6, status: 'active', createdAt: '2025-02-10T12:00:00Z', updatedAt: '2025-02-10T12:00:00Z' },
    { id: 'prod-7', sellerId: 'user-2', title: 'Apple Watch Series 9 45mm', description: 'Apple Watch in excellent condition. GPS model. Midnight aluminum case with sport band. AppleCare until June 2025.', price: 320000, currency: 'KRW', category: 'Electronics', condition: 'Like New', location: 'Itaewon, Seoul', images: [`https://images.unsplash.com/${unsplashIds[4]}?w=400`], dealTypes: ['direct', 'parcel'], views: 145, likes: 18, status: 'active', createdAt: '2025-02-09T20:00:00Z', updatedAt: '2025-02-09T20:00:00Z' },
    { id: 'prod-8', sellerId: 'user-3', title: 'Mechanical Keyboard Cherry MX', description: 'Custom mechanical keyboard with Cherry MX Brown switches. RGB backlighting. TKL layout. Used for 6 months.', price: 75000, currency: 'KRW', category: 'Electronics', condition: 'Good', location: 'Hongdae, Seoul', images: [`https://images.unsplash.com/${unsplashIds[8]}?w=400`], dealTypes: ['parcel'], views: 67, likes: 5, status: 'active', createdAt: '2025-02-09T15:00:00Z', updatedAt: '2025-02-09T15:00:00Z' },
    { id: 'prod-9', sellerId: 'user-4', title: 'Leather Messenger Bag', description: 'Genuine leather messenger bag. Perfect for work or school. Fits 15-inch laptops. Minor wear on corners.', price: 45000, currency: 'KRW', category: 'Fashion', condition: 'Fair', location: 'Mapo, Seoul', images: [`https://images.unsplash.com/${unsplashIds[9]}?w=400`], dealTypes: ['direct', 'parcel'], views: 34, likes: 2, status: 'active', createdAt: '2025-02-09T10:00:00Z', updatedAt: '2025-02-09T10:00:00Z' },
    { id: 'prod-10', sellerId: 'user-5', title: 'IKEA Sofa Bed - Grey', description: 'Comfortable sofa bed from IKEA. Converts easily for guests. Grey fabric cover is removable and washable.', price: 150000, currency: 'KRW', category: 'Furniture', condition: 'Good', location: 'Sinchon, Seoul', images: [`https://images.unsplash.com/${unsplashIds[1]}?w=400`], dealTypes: ['direct'], views: 98, likes: 7, status: 'active', createdAt: '2025-02-08T18:00:00Z', updatedAt: '2025-02-08T18:00:00Z' },
    { id: 'prod-11', sellerId: 'user-1', title: 'AirPods Pro 2nd Gen', description: 'Apple AirPods Pro 2nd generation with MagSafe case. Active noise cancellation works perfectly. 8 months old.', price: 150000, currency: 'KRW', category: 'Electronics', condition: 'Like New', location: 'Gangnam, Seoul', images: [`https://images.unsplash.com/${unsplashIds[10]}?w=400`], dealTypes: ['direct', 'parcel'], views: 178, likes: 22, status: 'active', createdAt: '2025-02-08T14:00:00Z', updatedAt: '2025-02-08T14:00:00Z' },
    { id: 'prod-12', sellerId: 'user-2', title: 'Running Shoes Nike Pegasus 40', description: 'Nike Pegasus 40 running shoes. Size 275. Used for about 100km of running. Still in great shape.', price: 55000, currency: 'KRW', category: 'Sports & Outdoors', condition: 'Good', location: 'Itaewon, Seoul', images: [`https://images.unsplash.com/${unsplashIds[11]}?w=400`], dealTypes: ['direct'], views: 43, likes: 4, status: 'active', createdAt: '2025-02-07T11:00:00Z', updatedAt: '2025-02-07T11:00:00Z' },
    { id: 'prod-13', sellerId: 'user-4', title: 'Queen Size Bed Frame', description: 'Wooden queen size bed frame. Sturdy construction, no squeaking. Disassembled for easy transport.', price: 200000, currency: 'KRW', category: 'Furniture', condition: 'Good', location: 'Mapo, Seoul', images: [`https://images.unsplash.com/${unsplashIds[12]}?w=400`], dealTypes: ['direct'], views: 72, likes: 5, status: 'active', createdAt: '2025-02-07T08:00:00Z', updatedAt: '2025-02-07T08:00:00Z' },
    { id: 'prod-14', sellerId: 'user-5', title: 'PlayStation 5 + 3 Games', description: 'PS5 Disc edition with 3 games (Spider-Man 2, Horizon, God of War). Two controllers included. All in perfect working condition.', price: 400000, currency: 'KRW', category: 'Electronics', condition: 'Good', location: 'Sinchon, Seoul', images: [`https://images.unsplash.com/${unsplashIds[15]}?w=400`], dealTypes: ['direct', 'parcel'], views: 256, likes: 32, status: 'active', createdAt: '2025-02-06T19:00:00Z', updatedAt: '2025-02-06T19:00:00Z' },
    { id: 'prod-15', sellerId: 'user-3', title: 'Mountain Bike Trek Marlin 5', description: 'Trek Marlin 5 mountain bike. Size M frame. Recently serviced with new brake pads and chain.', price: 350000, currency: 'KRW', category: 'Sports & Outdoors', condition: 'Good', location: 'Hongdae, Seoul', images: [`https://images.unsplash.com/${unsplashIds[18]}?w=400`], dealTypes: ['direct'], views: 64, likes: 8, status: 'active', createdAt: '2025-02-06T14:00:00Z', updatedAt: '2025-02-06T14:00:00Z' },
];

const SAMPLE_REVIEWS: Review[] = [
    { id: 'rev-1', reviewerId: 'user-2', revieweeId: 'user-1', productId: 'prod-1', rating: 5, comment: 'Great seller! Item was exactly as described. Fast response and smooth transaction.', createdAt: '2025-02-01T10:00:00Z' },
    { id: 'rev-2', reviewerId: 'user-3', revieweeId: 'user-1', productId: 'prod-3', rating: 4, comment: 'Good experience overall. Product was in great condition.', createdAt: '2025-01-28T15:00:00Z' },
    { id: 'rev-3', reviewerId: 'user-1', revieweeId: 'user-2', productId: 'prod-2', rating: 5, comment: 'Very friendly and responsive. Would buy again!', createdAt: '2025-01-25T12:00:00Z' },
    { id: 'rev-4', reviewerId: 'user-4', revieweeId: 'user-5', productId: 'prod-6', rating: 4, comment: 'Camera was in good condition as described. Slightly slower shipping than expected.', createdAt: '2025-02-05T09:00:00Z' },
    { id: 'rev-5', reviewerId: 'user-5', revieweeId: 'user-4', productId: 'prod-5', rating: 5, comment: 'Outstanding seller! Phone was perfectly packed and delivered quickly.', createdAt: '2025-02-03T14:00:00Z' },
];

const SAMPLE_POSTS: Post[] = [
    { id: 'post-1', authorId: 'user-1', content: '\u{1F1F0}\u{1F1F7} Tips for foreigners in Seoul: Always check the expiration date on your ARC (Alien Registration Card). You can renew it at any immigration office. Pro tip: Book your appointment online to avoid long waits!', images: [], tags: ['tips', 'seoul', 'visa'], likes: 15, commentsCount: 3, language: 'en', createdAt: '2025-02-12T08:00:00Z', updatedAt: '2025-02-12T08:00:00Z' },
    { id: 'post-2', authorId: 'user-4', content: 'Looking for recommendations for affordable furniture stores in Seoul! Just moved to a new apartment in Mapo-gu. Any suggestions? \u{1F3E0}', images: [], tags: ['furniture', 'seoul', 'help'], likes: 8, commentsCount: 5, language: 'en', createdAt: '2025-02-11T16:00:00Z', updatedAt: '2025-02-11T16:00:00Z' },
    { id: 'post-3', authorId: 'user-5', content: 'Had an amazing experience at the Language Exchange meetup in Hongdae last weekend! Met people from over 10 different countries. Highly recommend for anyone looking to practice Korean! \u{1F30D}', images: [], tags: ['meetup', 'hongdae', 'language'], likes: 22, commentsCount: 7, language: 'en', createdAt: '2025-02-10T20:00:00Z', updatedAt: '2025-02-10T20:00:00Z' },
    { id: 'post-4', authorId: 'user-2', content: 'Warning: Be careful when buying electronics from strangers. Always test the device before paying! I had a bad experience last month with a faulty laptop. Use Re;Tem\'s chat feature to ask for video proof! \u{1F4F1}\u{1F4A1}', images: [], tags: ['tips', 'electronics', 'safety'], likes: 31, commentsCount: 12, language: 'en', createdAt: '2025-02-09T11:00:00Z', updatedAt: '2025-02-09T11:00:00Z' },
];

const SAMPLE_COMMENTS: Comment[] = [
    { id: 'cmt-1', postId: 'post-1', authorId: 'user-3', content: 'This is so helpful! I almost forgot about my ARC renewal. Thanks!', createdAt: '2025-02-12T09:00:00Z' },
    { id: 'cmt-2', postId: 'post-2', authorId: 'user-1', content: 'Try IKEA in Gwangmyeong! Also check out the flea markets in Itaewon on weekends.', createdAt: '2025-02-11T17:00:00Z' },
    { id: 'cmt-3', postId: 'post-3', authorId: 'user-2', content: 'Which meetup group was this? I\'d love to join next time!', createdAt: '2025-02-10T21:00:00Z' },
];

const SAMPLE_CHATS: Chat[] = [
    { id: 'chat-1', productId: 'prod-1', buyerId: 'user-2', sellerId: 'user-1', lastMessage: 'Is it still available?', lastMessageAt: '2025-02-12T10:30:00Z', unreadCountBuyer: 0, unreadCountSeller: 1, createdAt: '2025-02-12T10:00:00Z' },
    { id: 'chat-2', productId: 'prod-5', buyerId: 'user-1', sellerId: 'user-4', lastMessage: 'Can you do \u20A9800,000?', lastMessageAt: '2025-02-12T09:00:00Z', unreadCountBuyer: 1, unreadCountSeller: 0, createdAt: '2025-02-11T15:00:00Z' },
];

const SAMPLE_MESSAGES: Message[] = [
    { id: 'msg-1', chatId: 'chat-1', senderId: 'user-2', messageType: 'text', content: 'Hello! Is this MacBook still available?', isRead: true, createdAt: '2025-02-12T10:30:00Z' },
    { id: 'msg-2', chatId: 'chat-1', senderId: 'user-1', messageType: 'text', content: 'Yes, it is! Are you interested?', isRead: true, createdAt: '2025-02-12T10:32:00Z' },
    { id: 'msg-3', chatId: 'chat-1', senderId: 'user-2', messageType: 'offer', content: JSON.stringify({ productId: 'prod-1', originalPrice: 1200000, offerPrice: 1100000, status: 'pending' }), isRead: false, createdAt: '2025-02-12T10:35:00Z' },
    { id: 'msg-4', chatId: 'chat-2', senderId: 'user-1', messageType: 'text', content: 'Hi! I\'m interested in the Galaxy S24. Is it still available?', isRead: true, createdAt: '2025-02-11T15:00:00Z' },
    { id: 'msg-5', chatId: 'chat-2', senderId: 'user-4', messageType: 'text', content: 'Yes it is! The price is firm though.', isRead: true, createdAt: '2025-02-11T15:05:00Z' },
    { id: 'msg-6', chatId: 'chat-2', senderId: 'user-1', messageType: 'text', content: 'Can you do \u20A9800,000?', isRead: false, createdAt: '2025-02-12T09:00:00Z' },
];

const SAMPLE_NOTIFICATIONS: Notification[] = [
    { id: 'notif-1', userId: 'user-1', type: 'message', title: 'James Lee sent you a message', body: 'Hello! Is this MacBook still available?', relatedId: 'chat-1', isRead: false, createdAt: '2025-02-12T10:30:00Z' },
    { id: 'notif-2', userId: 'user-1', type: 'like', title: 'Someone liked your product', body: 'MacBook Pro 2023 received a like', relatedId: 'prod-1', isRead: true, createdAt: '2025-02-12T08:00:00Z' },
    { id: 'notif-3', userId: 'user-1', type: 'offer', title: 'James Lee made an offer', body: '\u20A91,100,000 for MacBook Pro 2023', relatedId: 'chat-1', isRead: false, createdAt: '2025-02-12T10:35:00Z' },
];

const SEED_VERSION = 'v3'; // Increment when seed format changes

async function hashPassword(password: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
    return digest;
}

export async function seedData(): Promise<void> {
    const currentVersion = await AsyncStorage.getItem('retem_seed_version');

    const seeded = await storage.isSeeded();
    if (seeded && currentVersion === SEED_VERSION) return;

    // Seed version differs -> migrate
    if (seeded && currentVersion !== SEED_VERSION) {
        // Rewrite messages per-chat
        const chatIds = [...new Set(SAMPLE_MESSAGES.map(m => m.chatId))];
        for (const chatId of chatIds) {
            const key = `retem_messages_${chatId}`;
            const existing = await AsyncStorage.getItem(key);
            if (!existing) {
                const chatMsgs = SAMPLE_MESSAGES.filter(m => m.chatId === chatId);
                chatMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                await AsyncStorage.setItem(key, JSON.stringify(chatMsgs));
            }
        }

        // v3: Hash plain-text passwords
        const usersRaw = await AsyncStorage.getItem('retem_users');
        const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
        const updatedUsers = await Promise.all(
            users.map(async u => {
                // If passwordHash looks like plain text (short, no hex pattern), hash it
                if (u.passwordHash.length < 64) {
                    return { ...u, passwordHash: await hashPassword(u.passwordHash) };
                }
                return u;
            })
        );
        await AsyncStorage.setItem('retem_users', JSON.stringify(updatedUsers));

        await AsyncStorage.setItem('retem_seed_version', SEED_VERSION);
        return;
    }

    // Hash passwords before storing
    const usersWithHash = await Promise.all(
        SAMPLE_USERS.map(async u => ({
            ...u,
            passwordHash: await hashPassword(u.passwordHash), // passwordHash field holds plain text in seed
        }))
    );
    await storage.setUsers(usersWithHash);
    await storage.setProducts(SAMPLE_PRODUCTS);

    // Set chats
    const chats = await storage.getChats();
    SAMPLE_CHATS.forEach(c => { if (!chats.find(ec => ec.id === c.id)) chats.push(c); });
    await AsyncStorage.setItem('retem_chats', JSON.stringify(chats));

    // Set messages - per-chat key (retem_messages_{chatId})
    const chatIds = [...new Set(SAMPLE_MESSAGES.map(m => m.chatId))];
    for (const chatId of chatIds) {
        const chatMsgs = SAMPLE_MESSAGES.filter(m => m.chatId === chatId);
        chatMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        await AsyncStorage.setItem(`retem_messages_${chatId}`, JSON.stringify(chatMsgs));
    }

    // Set reviews
    await AsyncStorage.setItem('retem_reviews', JSON.stringify(SAMPLE_REVIEWS));

    // Set posts
    await AsyncStorage.setItem('retem_posts', JSON.stringify(SAMPLE_POSTS));

    // Set comments
    await AsyncStorage.setItem('retem_comments', JSON.stringify(SAMPLE_COMMENTS));

    // Set notifications
    await AsyncStorage.setItem('retem_notifications', JSON.stringify(SAMPLE_NOTIFICATIONS));

    await storage.markSeeded();
    await AsyncStorage.setItem('retem_seed_version', SEED_VERSION);
}
