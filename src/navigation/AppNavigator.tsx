import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageCircle, PlusCircle, Users, User } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screen imports — these will be created as screen files are added
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AddProductScreen from '../screens/AddProductScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import MyReviewsScreen from '../screens/MyReviewsScreen';
import TrustScoreScreen from '../screens/TrustScoreScreen';
import VerificationScreen from '../screens/VerificationScreen';
import HelpScreen from '../screens/HelpScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// ─── Navigation param types ──────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  ProductDetail: { productId: string };
  AddProduct: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { chatId: string; otherUserName?: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  Settings: undefined;
  MyListings: undefined;
  Favorites: undefined;
  MyReviews: undefined;
  TrustScore: undefined;
  Verification: undefined;
  Help: undefined;
  Terms: undefined;
  Privacy: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  SellTab: undefined;
  CommunityTab: undefined;
  ProfileTab: undefined;
};

// ─── Navigators ──────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const ChatStackNav = createNativeStackNavigator<ChatStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Stack screens ───────────────────────────────────────────────────

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Signup" component={SignupScreen} />
    </AuthStackNav.Navigator>
  );
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStackNav.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStackNav.Screen name="AddProduct" component={AddProductScreen} />
    </HomeStackNav.Navigator>
  );
}

function ChatStack() {
  return (
    <ChatStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ChatStackNav.Screen name="ChatList" component={ChatListScreen} />
      <ChatStackNav.Screen name="ChatRoom" component={ChatRoomScreen} />
    </ChatStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Settings" component={SettingsScreen} />
      <ProfileStackNav.Screen name="MyListings" component={MyListingsScreen} />
      <ProfileStackNav.Screen name="Favorites" component={FavoritesScreen} />
      <ProfileStackNav.Screen name="MyReviews" component={MyReviewsScreen} />
      <ProfileStackNav.Screen name="TrustScore" component={TrustScoreScreen} />
      <ProfileStackNav.Screen name="Verification" component={VerificationScreen} />
      <ProfileStackNav.Screen name="Help" component={HelpScreen} />
      <ProfileStackNav.Screen name="Terms" component={TermsScreen} />
      <ProfileStackNav.Screen name="Privacy" component={PrivacyScreen} />
      <ProfileStackNav.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStackNav.Navigator>
  );
}

// ─── Main Tabs ───────────────────────────────────────────────────────

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const tabBarBottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + tabBarBottomPadding,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: tabBarBottomPadding,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStack}
        options={{
          tabBarLabel: t('nav.chat'),
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SellTab"
        component={HomeStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.sellButton}>
              <PlusCircle size={28} color="#ffffff" />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e: { preventDefault: () => void }) => {
            e.preventDefault();
            (navigation as any).navigate('HomeTab', {
              screen: 'AddProduct',
            });
          },
        })}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityScreen}
        options={{
          tabBarLabel: t('nav.community'),
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ──────────────────────────────────────────────────

export default function AppNavigator() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sellButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
