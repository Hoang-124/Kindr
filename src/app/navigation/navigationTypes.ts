// src/app/navigation/navigationTypes.ts
import { ProductItem } from '../providers/ItemProvider';
import { WalletTransaction } from '../store/walletSlice';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  SignIn: undefined;
  SignUp: undefined;

  // Main App
  Home: undefined;
  Search: { category?: string } | undefined;
  ItemDetail: { item: ProductItem };
  PostItem: undefined;
  MyPosts: undefined;

  // Wallet
  Wallet: undefined;
  DepositXu: undefined;
  WithdrawXu: undefined;

  // Transactions
  TransactionDetail: { transaction: WalletTransaction; item?: ProductItem };
  ConfirmReceive: { item: ProductItem };
  Dispute: { item: ProductItem };

  // Communication
  Chat: { item?: ProductItem; chatName?: string } | undefined;
  Notifications: undefined;
  Review: { item: ProductItem };

  // Profile
  Profile: undefined;
  EditProfile: undefined;

  // Additional Features
  GiftStation: undefined;
  MapNearby: undefined;
  HelpCenter: undefined;
  PolicyScreen: undefined;

  // Admin
  AdminDashboard: undefined;
  AdminPosts: undefined;
  AdminDisputes: undefined;
  AdminWithdrawals: undefined;
};
