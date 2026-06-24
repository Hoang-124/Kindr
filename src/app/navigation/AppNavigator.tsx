// src/app/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';

// Import Screens
import SplashScreen from '../../features/auth/screens/SplashScreen';
import OnboardingScreen1 from '../../features/auth/screens/OnboardingScreen1';
import OnboardingScreen2 from '../../features/auth/screens/OnboardingScreen2';
import OnboardingScreen3 from '../../features/auth/screens/OnboardingScreen3';
import SignInScreen from '../../features/auth/screens/SignInScreen';
import SignUpScreen from '../../features/auth/screens/SignUpScreen';

import HomeScreen from '../../features/home/screens/HomeScreen';
import SearchScreen from '../../features/search/screens/SearchScreen';
import ItemDetailScreen from '../../features/product/screens/ItemDetailScreen';
import PostItemScreen from '../../features/product/screens/PostItemScreen';
import MyPostsScreen from '../../features/product/screens/MyPostsScreen';

import WalletScreen from '../../features/wallet/screens/WalletScreen';
import DepositXuScreen from '../../features/wallet/screens/DepositXuScreen';
import WithdrawXuScreen from '../../features/wallet/screens/WithdrawXuScreen';

import TransactionDetailScreen from '../../features/order/screens/TransactionDetailScreen';
import ConfirmReceiveScreen from '../../features/order/screens/ConfirmReceiveScreen';
import DisputeScreen from '../../features/order/screens/DisputeScreen';

import ChatScreen from '../../features/chat/screens/ChatScreen';
import NotificationsScreen from '../../features/chat/screens/NotificationsScreen';
import ReviewScreen from '../../features/order/screens/ReviewScreen';

import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import EditProfileScreen from '../../features/profile/screens/EditProfileScreen';

import GiftStationScreen from '../../features/home/screens/GiftStationScreen';
import MapNearbyScreen from '../../features/home/screens/MapNearbyScreen';
import HelpCenterScreen from '../../features/profile/screens/HelpCenterScreen';
import PolicyScreen from '../../features/profile/screens/PolicyScreen';

import AdminDashboardScreen from '../../features/admin/screens/AdminDashboardScreen';
import AdminPostsScreen from '../../features/admin/screens/AdminPostsScreen';
import AdminDisputesScreen from '../../features/admin/screens/AdminDisputesScreen';
import AdminWithdrawalsScreen from '../../features/admin/screens/AdminWithdrawalsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const kindrTheme = {
  headerStyle: { backgroundColor: '#F5F0E8' },
  headerTintColor: '#3D3D3D',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 16 },
  headerShadowVisible: false,
};

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        ...kindrTheme,
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Onboarding Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
      <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
      <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />

      {/* Auth */}
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />

      {/* Main App */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="PostItem" component={PostItemScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />

      {/* Wallet */}
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="DepositXu" component={DepositXuScreen} />
      <Stack.Screen name="WithdrawXu" component={WithdrawXuScreen} />

      {/* Transactions */}
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="ConfirmReceive" component={ConfirmReceiveScreen} />
      <Stack.Screen name="Dispute" component={DisputeScreen} />

      {/* Communication */}
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />

      {/* Profile */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      {/* Additional Features */}
      <Stack.Screen name="GiftStation" component={GiftStationScreen} />
      <Stack.Screen name="MapNearby" component={MapNearbyScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="PolicyScreen" component={PolicyScreen} />

      {/* Admin */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminPosts" component={AdminPostsScreen} />
      <Stack.Screen name="AdminDisputes" component={AdminDisputesScreen} />
      <Stack.Screen name="AdminWithdrawals" component={AdminWithdrawalsScreen} />
    </Stack.Navigator>
  );
}
