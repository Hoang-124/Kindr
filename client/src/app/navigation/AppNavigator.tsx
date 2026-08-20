// src/app/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './navigationTypes';
import { useAuth } from '../providers/AuthProvider';

// Import Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Import Details Screens
import ProductDetailScreen from '../../features/home/screens/ProductDetailScreen';
import TransactionDetailScreen from '../../features/exchange/screens/TransactionDetailScreen';
import ChatDetailScreen from '../../features/chat/screens/ChatDetailScreen';

// User Screens
import WalletScreen from '../../features/profile/screens/WalletScreen';
import TopUpScreen from '../../features/profile/screens/TopUpScreen';
import WithdrawScreen from '../../features/profile/screens/WithdrawScreen';
import MyPostsScreen from '../../features/post/screens/MyPostsScreen';
import EditPostScreen from '../../features/post/screens/EditPostScreen';
import NotificationScreen from '../../features/notification/screens/NotificationScreen';
import RatingReviewScreen from '../../features/grade/screens/RatingReviewScreen';
import DisputeFormScreen from '../../features/exchange/screens/DisputeFormScreen';
import DonationStationScreen from '../../features/post/screens/DonationStationScreen';
import CareHandbookScreen from '../../features/care-handbook/screens/CareHandbookScreen';

// Admin Screens
import AdminDashboardScreen from '../../features/admin/screens/AdminDashboardScreen';
import ManageUsersScreen from '../../features/admin/screens/ManageUsersScreen';
import ManagePostsScreen from '../../features/admin/screens/ManagePostsScreen';
import ManageCategoriesScreen from '../../features/admin/screens/ManageCategoriesScreen';
import ManageTransactionsScreen from '../../features/admin/screens/ManageTransactionsScreen';
import ManageDisputesScreen from '../../features/admin/screens/ManageDisputesScreen';
import ManageWithdrawsScreen from '../../features/admin/screens/ManageWithdrawsScreen';
import ManageReportsScreen from '../../features/admin/screens/ManageReportsScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
  const { currentUser } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!currentUser ? (
          // Guest flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Logged-in flow
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="TopUp" component={TopUpScreen} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} />
            <Stack.Screen name="MyPosts" component={MyPostsScreen} />
            <Stack.Screen name="EditPost" component={EditPostScreen} />
            <Stack.Screen name="Notification" component={NotificationScreen} />
            <Stack.Screen name="RatingReview" component={RatingReviewScreen} />
            <Stack.Screen name="DisputeForm" component={DisputeFormScreen} />
            <Stack.Screen name="DonationStation" component={DonationStationScreen} />
            <Stack.Screen name="CareHandbook" component={CareHandbookScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
            <Stack.Screen name="ManagePosts" component={ManagePostsScreen} />
            <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
            <Stack.Screen name="ManageTransactions" component={ManageTransactionsScreen} />
            <Stack.Screen name="ManageDisputes" component={ManageDisputesScreen} />
            <Stack.Screen name="ManageWithdraws" component={ManageWithdrawsScreen} />
            <Stack.Screen name="ManageReports" component={ManageReportsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
