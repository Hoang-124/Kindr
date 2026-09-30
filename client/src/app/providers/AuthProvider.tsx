// src/app/providers/AuthProvider.tsx
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginUser,
  registerUser,
  adjustCivilizationPoints,
  fetchCurrentUser,
  loginAsync,
  loginGoogleAsync,
  demoLoginAsync,
  registerAsync,
  activateAccountAsync,
  logoutAsync,
  updateProfileAsync,
  changePasswordAsync,
} from '../../features/auth/store/authSlice';
import { User } from '../../types/user';
import { socketService } from '../../services/socketService';
import { registerPushNotifications, unregisterPushNotifications } from '../../services/pushNotificationClient';
import { setUnreadCount, addNotification, setNotifications } from '../../features/notification/store/notificationSlice';
import { fetchMyTransactionsAsync } from '../../features/exchange/store/exchangeSlice';
import * as notificationService from '../../services/notificationService';
import * as chatService from '../../services/chatService';
import { hydrateChats, receiveIncomingMessage, setLatestUnreadSender } from '../../features/chat/store/chatSlice';
import { Notification } from '../../types/notification';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  error: string | null;
  login: (userId: string) => void;
  loginWithCredentials: (phone: string, password: string) => Promise<any>;
  loginWithGoogle: (googleData: { credential?: string; idToken?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => Promise<any>;
  loginDemo: () => Promise<any>;
  register: (name: string, phone: string, email: string, districtId: string, addressDetail: string) => void;
  registerWithCredentials: (payload: { name: string; phone: string; password: string; email?: string; districtId?: string; districtName?: string; addressDetail?: string }) => Promise<any>;
  activateAccount: (email: string, otp: string) => Promise<any>;
  updateProfile: (payload: { name?: string; phone?: string; avatar?: string; bio?: string; districtId?: string; districtName?: string; addressDetail?: string }) => Promise<any>;
  changePassword: (payload: { oldPassword?: string; newPassword: string }) => Promise<any>;
  logout: () => Promise<void>;
  rewardCivilizationPoints: (userId: string, points: number, reason: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const allUsers = useAppSelector((state) => state.auth.allUsers);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const error = useAppSelector((state) => state.auth.error);

  // Check current session & auto-connect Socket + register Push Token on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        await dispatch(fetchCurrentUser()).unwrap();
        await socketService.connect();
        registerPushNotifications();
      } catch {
        // Fallback: If local demo user is present, socket connects if token is stored
      }
    };
    initSession();
  }, [dispatch]);

  // Global Real-time Notification Subscriber & Chat Unread Sync
  useEffect(() => {
    if (!currentUser) return;

    let isSubscribed = true;
    const processedIds = new Set<string>();

    // 1. Fetch initial transactions, notifications, and chats to hydrate badges immediately
    dispatch(fetchMyTransactionsAsync());

    // Hydrate chat list & unread count on startup
    chatService.getChats()
      .then((apiChats) => {
        if (isSubscribed && apiChats && apiChats.length > 0) {
          dispatch(hydrateChats(apiChats));
        }
      })
      .catch(() => {});

    notificationService.getNotifications(1, 20)
      .then(({ notifications: items }) => {
        if (isSubscribed) {
          dispatch(setNotifications(items));
        }
      })
      .catch(() => {
        notificationService.getUnreadCount()
          .then((count) => {
            if (isSubscribed) {
              dispatch(setUnreadCount(count));
            }
          })
          .catch(() => {});
      });

    // Ensure socket is connected for active user
    socketService.connect().catch(() => {});

    // 2. Global listener for incoming chat messages across the entire app
    const handleIncomingMessageGlobal = (payload: any) => {
      const msg = payload.message || payload;
      const targetChatId = payload.chatId || msg.chatId;
      if (targetChatId) {
        const rawSenderId = msg.senderId?._id?.toString() || msg.senderId?.toString() || msg.senderId;
        // Ignore own messages in global handler (ChatDetailScreen already handles local optimistic sending)
        if (rawSenderId && rawSenderId === currentUser.id) {
          return;
        }

        const normalizedMsg = {
          id: msg.id || msg._id || ('m_' + Date.now()),
          senderId: rawSenderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          tempId: payload.tempId || msg.tempId,
          timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
        };

        dispatch(receiveIncomingMessage({
          chatId: targetChatId,
          message: normalizedMsg,
          currentUserId: currentUser.id,
          tempId: payload.tempId || msg.tempId,
        }));
      }
    };

    // 3. Global listener for real-time notification pushes
    const handleGlobalNotification = (notif: any) => {
      const notifId = notif.id || notif._id?.toString();
      if (notifId && processedIds.has(notifId)) {
        return; // Skip duplicate event fired across multiple socket channels
      }
      if (notifId) {
        processedIds.add(notifId);
        setTimeout(() => processedIds.delete(notifId), 60000);
      }

      console.log('🔔 [Client] Received notification event:', notif);
      const normalized: Notification = {
        id: notif.id || notif._id?.toString() || 'n_' + Date.now(),
        userId: notif.userId?.toString() || currentUser.id,
        title: notif.title || 'Thông báo mới',
        body: notif.body || '',
        type: notif.type || 'system',
        isRead: false,
        relatedProductId: notif.relatedProductId?._id?.toString() || notif.relatedProductId?.toString() || notif.data?.productId,
        relatedTransactionId: notif.relatedTransactionId?._id?.toString() || notif.relatedTransactionId?.toString() || notif.data?.transactionId,
        data: notif.data,
        createdAt: notif.createdAt || new Date().toISOString(),
      };
      dispatch(addNotification(normalized));

      // Handle chat message notifications
      if (normalized.type === 'chat_message') {
        const targetChatId = notif.data?.chatId;
        if (targetChatId && notif.data?.senderId !== currentUser.id) {
          dispatch(setLatestUnreadSender({
            senderId: notif.data.senderId,
            senderName: notif.data.senderName || notif.title?.replace('Tin nhắn từ ', '') || 'Mẹ bỉm',
            senderAvatar: notif.data.senderAvatar || '',
            content: notif.body || 'Đã gửi một tin nhắn mới',
            chatId: targetChatId,
            timestamp: notif.createdAt || new Date().toISOString(),
          }));

          // Re-sync chat metadata
          chatService.getChats()
            .then((freshChats) => {
              if (isSubscribed && freshChats) {
                dispatch(hydrateChats(freshChats));
              }
            })
            .catch(() => {});
        }
        return; // Don't show system Alert popup for chat messages
      }

      // Refresh transactions and wallet balance if notification relates to an exchange or dispute
      if (['match_request', 'trade', 'safeful_time_started', 'xu_released', 'dispute_opened', 'dispute_resolved'].includes(normalized.type)) {
        dispatch(fetchMyTransactionsAsync());
        dispatch(fetchCurrentUser());
      }

      // Immediate Alert popup for high-priority notifications (match_request, trade, dispute)
      if (['match_request', 'trade', 'safeful_time_started', 'xu_released', 'post_approved', 'dispute_opened', 'dispute_resolved'].includes(normalized.type)) {
        Alert.alert(
          normalized.title,
          normalized.body,
          [{ text: 'Đồng ý' }]
        );
      }
    };

    // 4. Real-time wallet & transaction sync listeners
    const handleWalletUpdated = (payload: any) => {
      console.log('💰 [Client] Wallet updated event received:', payload);
      dispatch(fetchCurrentUser());
    };

    const handleTransactionUpdated = (payload: any) => {
      console.log('🔄 [Client] Transaction updated event received:', payload);
      dispatch(fetchMyTransactionsAsync());
    };

    socketService.on('message_received', handleIncomingMessageGlobal);
    socketService.on('notification_new', handleGlobalNotification);
    socketService.on('notification', handleGlobalNotification);
    socketService.on('wallet_updated', handleWalletUpdated);
    socketService.on('transaction_updated', handleTransactionUpdated);

    return () => {
      isSubscribed = false;
      socketService.off('message_received', handleIncomingMessageGlobal);
      socketService.off('notification_new', handleGlobalNotification);
      socketService.off('notification', handleGlobalNotification);
      socketService.off('wallet_updated', handleWalletUpdated);
      socketService.off('transaction_updated', handleTransactionUpdated);
    };
  }, [currentUser, dispatch]);

  // Polling fallback: sync unread notification count every 30s
  useEffect(() => {
    if (!currentUser) return;

    const pollInterval = setInterval(() => {
      notificationService.getUnreadCount()
        .then((count) => dispatch(setUnreadCount(count)))
        .catch(() => {});
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [currentUser, dispatch]);

  const login = (userId: string) => {
    dispatch(loginUser(userId));
  };

  const loginWithCredentials = async (phone: string, password: string) => {
    const res = await dispatch(loginAsync({ phone, password })).unwrap();
    await socketService.connect();
    registerPushNotifications();
    return res;
  };

  const loginWithGoogle = async (googleData: { credential?: string; idToken?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => {
    const res = await dispatch(loginGoogleAsync(googleData)).unwrap();
    await socketService.connect();
    registerPushNotifications();
    return res;
  };

  const loginDemo = async () => {
    const res = await dispatch(demoLoginAsync()).unwrap();
    await socketService.connect();
    registerPushNotifications();
    return res;
  };

  const registerWithCredentials = async (payload: {
    name: string;
    phone: string;
    password: string;
    email?: string;
    districtId?: string;
    districtName?: string;
    addressDetail?: string;
  }) => {
    const res = await dispatch(registerAsync(payload)).unwrap();
    if (!res?.needsActivation) {
      await socketService.connect();
      registerPushNotifications();
    }
    return res;
  };

  const activateAccount = async (email: string, otp: string) => {
    const res = await dispatch(activateAccountAsync({ email, otp })).unwrap();
    await socketService.connect();
    registerPushNotifications();
    return res;
  };

  const logout = async () => {
    socketService.disconnect();
    await unregisterPushNotifications();
    await dispatch(logoutAsync()).unwrap();
  };


  const register = (name: string, phone: string, email: string, districtId: string, addressDetail: string) => {
    const districtName =
      districtId === 'hc' ? 'Quận Hải Châu' :
      districtId === 'tk' ? 'Quận Thanh Khê' :
      districtId === 'st' ? 'Quận Sơn Trà' :
      districtId === 'nhs' ? 'Quận Ngũ Hành Sơn' :
      districtId === 'lc' ? 'Quận Liên Chiểu' :
      districtId === 'cl' ? 'Quận Cẩm Lệ' : 'Huyện Hòa Vang';

    dispatch(
      registerUser({
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        name,
        phone,
        email,
        avatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuB6-3G4y5VT09QB_r93FRE4nbSeWA2JCI990UQ9fhsMbTpZwuWK7kzxF-aQr9sJydki3zE-zHuMhzYGrY8mkFtwUsUVYdsl1VZ1q8GRLxjB_GPiS-ULsQ8QKCz05f5wl8frZsErROB6ZrZQ4vv7ZYc3a3Vgb3rNTd-HotoTrX_2k0ha0Ih0KDR1q3HIBr-l94ZD99yk-sFPH_0k1BTd4EESpggGMyGmtGLgewt3DOhn5A1GTNDMgPQ7Q210FABw-JPNZnKZaau1gozw',
        location: {
          districtId,
          districtName,
          addressDetail,
        },
      })
    );
  };

  const updateProfile = async (payload: {
    name?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    districtId?: string;
    districtName?: string;
    addressDetail?: string;
  }) => {
    return dispatch(updateProfileAsync(payload)).unwrap();
  };

  const changePassword = async (payload: { oldPassword?: string; newPassword: string }) => {
    return dispatch(changePasswordAsync(payload)).unwrap();
  };


  const rewardCivilizationPoints = (userId: string, points: number, reason: string) => {
    dispatch(adjustCivilizationPoints({ userId, points, reason }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        error,
        login,
        loginWithCredentials,
        loginWithGoogle,
        loginDemo,
        register,
        registerWithCredentials,
        activateAccount,
        updateProfile,
        changePassword,
        logout,
        rewardCivilizationPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
