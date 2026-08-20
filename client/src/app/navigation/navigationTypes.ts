// src/app/navigation/navigationTypes.ts

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Post: undefined;
  ChatList: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProductDetail: { id: string };
  TransactionDetail: { id: string };
  ChatDetail: { chatId: string };
  MyPosts: undefined;
  EditPost: { postId: string };
  Wallet: undefined;
  TopUp: undefined;
  Withdraw: undefined;
  Notification: undefined;
  RatingReview: { transactionId: string };
  DisputeForm: { transactionId: string };
  DonationStation: undefined;
  CareHandbook: undefined;
  AdminDashboard: undefined;
  ManageUsers: undefined;
  ManagePosts: undefined;
  ManageCategories: undefined;
  ManageTransactions: undefined;
  ManageDisputes: undefined;
  ManageWithdraws: undefined;
  ManageReports: undefined;
};

// Make the types globally available to navigation hooks
declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}
