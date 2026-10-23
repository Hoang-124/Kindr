// d:\Kindr\web\src\context\AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Product,
  Transaction,
  ChatSession,
  NotificationItem,
} from '../types';
import { getAccessToken, clearAuthTokens } from '../services/api';
import {
  authApi,
  productApi,
  transactionApi,
  chatApi,
  notificationApi,
  normalizeNotification,
} from '../services/domainServices';
import { socketService } from '../services/socketService';

export const FALLBACK_WEB_PRODUCTS: Product[] = [
  {
    id: 'demo_prod_1',
    name: 'Đồ chơi gỗ Montessori Luồn hạt đa giác phát triển trí não',
    price: 4,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'do_choi',
    ageRange: '1-3 tuổi',
    distance: '0.8 km',
    coordinates: { latitude: 16.0748, longitude: 108.2215 },
    locationName: 'P. Thạch Thang, Q. Hải Châu, Đà Nẵng',
    wardId: 'hc_thachthang',
    districtId: 'dn_haichau',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Bộ luồn hạt gỗ tự nhiên sơn gốc nước an toàn không mùi, các hạt gỗ nhẵn bóng không có dằm. Bé nhà mình chơi rất giữ gìn, còn nguyên hộp.',
    sellerId: 'seller_hoalan',
    sellerName: 'Mẹ Hoa Lan',
    sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905123456',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'demo_prod_2',
    name: 'Set 3 bộ body suit cộc tay Nous Organic Cotton size 3-6m',
    price: 5,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'quan_ao',
    ageRange: '0-12 tháng',
    distance: '1.2 km',
    coordinates: { latitude: 16.0642, longitude: 108.1912 },
    locationName: 'P. Vĩnh Trung, Q. Thanh Khê, Đà Nẵng',
    wardId: 'tk_vinhzhong',
    districtId: 'dn_thankhe',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Set body Nous vải sợi tre siêu thoáng mát, thấm hút mồ hôi. Bé trộm vía tăng cân nhanh nên chỉ mặc 2 tuần là chật, đã giặt nước giặt hữu cơ thơm tho.',
    sellerId: 'seller_mebap',
    sellerName: 'Mẹ Bắp',
    sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905234567',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'demo_prod_3',
    name: 'Xe chòi chân hình chú Khủng Long có nhạc và đèn LED',
    price: 8,
    condition: '80',
    conditionLabel: 'Mới 80% (Khá mới)',
    category: 'xe_noi',
    ageRange: '1-3 tuổi',
    distance: '1.5 km',
    coordinates: { latitude: 16.0785, longitude: 108.2385 },
    locationName: 'P. An Hải Bắc, Q. Sơn Trà, Đà Nẵng',
    wardId: 'st_anhai',
    districtId: 'dn_sontra',
    image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&auto=format&fit=crop&q=80',
    description: 'Xe chòi chân nhựa đúc nguyên khối chịu lực 30kg, bánh xe chống trượt êm ái không gây xước sàn gỗ. Nhạc và đèn hoạt động hoàn hảo.',
    sellerId: 'seller_ngocanh',
    sellerName: 'Mẹ Ngọc Ánh',
    sellerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905345678',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'demo_prod_4',
    name: 'Bộ sách vải Lalala Baby 6 cuốn kích thích đa giác quan',
    price: 2,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'sach_truyen',
    ageRange: '0-12 tháng',
    distance: '2.1 km',
    coordinates: { latitude: 15.9782, longitude: 108.2618 },
    locationName: 'P. Hòa Hải (KĐT FPT City), Q. Ngũ Hành Sơn, Đà Nẵng',
    wardId: 'nhs_hoahai',
    districtId: 'dn_nguhanhson',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    description: 'Sách vải có tiếng sột soạt vui tai, đuôi thú nổi 3D giúp bé luyện cầm nắm, gặm nướu an toàn 100%, giặt máy thoải mái.',
    sellerId: 'seller_daudau',
    sellerName: 'Mẹ Dâu Dâu',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905456789',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'demo_prod_5',
    name: 'Ghế ăn dặm Hanbei gấp gọn có bánh xe & khay ăn kép',
    price: 15,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'xe_noi',
    ageRange: '0-12 tháng',
    distance: '1.1 km',
    coordinates: { latitude: 16.0558, longitude: 108.2182 },
    locationName: 'P. Hòa Thuận Đông, Q. Hải Châu, Đà Nẵng',
    wardId: 'hc_hoathuan',
    districtId: 'dn_haichau',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80',
    description: 'Ghế ăn dặm Hanbei điều chỉnh 3 độ cao, có đệm da PU chống thấm nước, đai an toàn 5 điểm chắc chắn.',
    sellerId: 'seller_hoalan',
    sellerName: 'Mẹ Hoa Lan',
    sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905123456',
    safeFeeLocked: 2,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'demo_prod_6',
    name: 'Bộ xếp hình Lego Duplo 65 chi tiết chính hãng Đan Mạch',
    price: 10,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'toy_large',
    ageRange: '1-3 tuổi',
    distance: '1.7 km',
    coordinates: { latitude: 16.0628, longitude: 108.2442 },
    locationName: 'P. Phước Mỹ, Q. Sơn Trà, Đà Nẵng',
    wardId: 'st_phuocmy',
    districtId: 'dn_sontra',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
    description: 'Gạch Lego Duplo kích thước lớn chống hóc cho bé từ 18 tháng. Đủ 65 mảnh ghép kèm thùng nhựa đựng chính hãng.',
    sellerId: 'seller_ngocanh',
    sellerName: 'Mẹ Ngọc Ánh',
    sellerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905345678',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'demo_prod_7',
    name: '[Tặng 0 Xu] Combo 4 bình sữa Pigeon & Túi trữ sữa Sunmum',
    price: 0,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'charity',
    ageRange: '0-12 tháng',
    distance: '0.6 km',
    coordinates: { latitude: 16.0605, longitude: 108.2155 },
    locationName: 'Trạm Tặng Đồ Hải Châu, 112 Nguyễn Văn Linh, Đà Nẵng',
    wardId: 'hc_thachthang',
    districtId: 'dn_haichau',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
    description: 'Mình mua dư hộp túi trữ sữa nguyên seal và 4 bình sữa đã tiệt trùng kỹ. Gửi tặng 0 Xu cho mẹ nào sắp sinh bé nhé!',
    sellerId: 'seller_hoalan',
    sellerName: 'Mẹ Hoa Lan',
    sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905123456',
    safeFeeLocked: 0,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: 'demo_prod_8',
    name: '[Tặng 0 Xu] Bộ thẻ học thông minh Glenn Doman 100 chủ đề',
    price: 0,
    condition: '80',
    conditionLabel: 'Mới 80% (Khá mới)',
    category: 'tu_thien',
    ageRange: '1-3 tuổi',
    distance: '1.9 km',
    coordinates: { latitude: 15.9795, longitude: 108.2602 },
    locationName: 'Trạm Tặng Đồ FPT Plaza 2, Q. Ngũ Hành Sơn, Đà Nẵng',
    wardId: 'nhs_hoahai',
    districtId: 'dn_nguhanhson',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    description: 'Bộ Flashcard giấy Ivory cứng cáp chống lóa mắt cho bé tập nói. Tặng miễn phí 0 Xu tại sảnh FPT Plaza 2.',
    sellerId: 'seller_daudau',
    sellerName: 'Mẹ Dâu Dâu',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905456789',
    safeFeeLocked: 0,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export interface ToastBanner {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

interface AppContextValue {
  currentUser: User | null;
  authLoading: boolean;
  products: Product[];
  productsLoading: boolean;
  transactions: Transaction[];
  chats: ChatSession[];
  notifications: NotificationItem[];
  unreadNotifCount: number;
  unreadChatCount: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onboardingOpen: boolean;
  setOnboardingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toast: ToastBanner | null;
  showToast: (toast: Omit<ToastBanner, 'id'>) => void;
  dismissToast: () => void;
  refreshUser: () => Promise<void>;
  refreshProducts: (filters?: Record<string, any>) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshChats: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>(FALLBACK_WEB_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState<ToastBanner | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kindr_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kindr_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const showToast = useCallback((t: Omit<ToastBanner, 'id'>) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToast({ ...t, id });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const me = await authApi.getMe();
      setCurrentUser(me);
    } catch {
      clearAuthTokens();
      setCurrentUser(null);
    }
  }, []);

  const refreshProducts = useCallback(async (filters?: Record<string, any>) => {
    setProductsLoading(true);
    try {
      const list = await productApi.getProducts(filters);
      if (list && list.length > 0) {
        setProducts(list);
      }
    } catch {
      // Keep fallback products if API is unreachable
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const list = await transactionApi.getMyTransactions();
      setTransactions(list);
    } catch {
      // Ignore
    }
  }, []);

  const refreshChats = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const list = await chatApi.getChats();
      setChats(list);
    } catch {
      // Ignore
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const list = await notificationApi.getNotifications(1, 30);
      setNotifications(list);
    } catch {
      // Ignore
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setCurrentUser(null);
    setTransactions([]);
    setChats([]);
    setNotifications([]);
  }, []);

  // Initial Bootstrap
  useEffect(() => {
    let mounted = true;
    async function init() {
      await refreshProducts();
      const token = getAccessToken();
      if (token) {
        try {
          const me = await authApi.getMe();
          if (mounted) {
            setCurrentUser(me);
            socketService.connect();
          }
        } catch {
          clearAuthTokens();
        }
      }
      if (mounted) {
        setAuthLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [refreshProducts]);

  // Real-time Socket.IO Synchronization when logged in
  useEffect(() => {
    if (!currentUser) return;

    refreshTransactions();
    refreshChats();
    refreshNotifications();
    socketService.connect();

    const handleNewNotification = (raw: any) => {
      const notif = normalizeNotification(raw);
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });

      const isDispute = notif.type === 'dispute_opened' || notif.type === 'dispute_resolved';
      const isWallet =
        notif.type === 'xu_released' ||
        notif.type === 'topup_success' ||
        notif.type === 'withdraw_approved' ||
        notif.type === 'withdraw_rejected' ||
        notif.type === 'welcome_credit';

      if (isWallet || isDispute || notif.type === 'match_request' || notif.type === 'safeful_time_started') {
        refreshUser();
        refreshTransactions();
        refreshProducts();
      }

      showToast({
        title: notif.title,
        message: notif.body,
        type: notif.type === 'dispute_opened' ? 'warning' : 'success',
        link: notif.relatedTransactionId
          ? `/transactions/${notif.relatedTransactionId}`
          : notif.relatedProductId
          ? `/products/${notif.relatedProductId}`
          : undefined,
      });
    };

    const handleWalletUpdated = () => {
      refreshUser();
    };

    const handleTopupSuccess = (payload: any) => {
      refreshUser();
      refreshNotifications();
      const xu = payload?.xuAmount || 0;
      if (xu > 0) {
        showToast({
          title: 'Nạp Xu thành công! 🎉',
          message: `Ví của mẹ vừa được cộng thêm +${xu} Xu qua VietQR.`,
          type: 'success',
          link: '/wallet',
        });
      }
    };

    const handleTransactionUpdated = () => {
      refreshTransactions();
      refreshUser();
      refreshProducts();
    };

    const handleChatUpdated = () => {
      refreshChats();
    };

    const handleMessageReceived = (payload: any) => {
      refreshChats();
      const senderId = payload?.message?.senderId;
      if (senderId && senderId !== currentUser.id) {
        showToast({
          title: `Tin nhắn từ ${payload.message.senderName || 'Mẹ Bỉm'}`,
          message: payload.message.content || 'Bạn có tin nhắn mới',
          type: 'info',
          link: payload.chatId ? `/chat/${payload.chatId}` : '/chat',
        });
      }
    };

    socketService.on('notification_new', handleNewNotification);
    socketService.on('wallet_updated', handleWalletUpdated);
    socketService.on('topup_success', handleTopupSuccess);
    socketService.on('transaction_updated', handleTransactionUpdated);
    socketService.on('chat_updated', handleChatUpdated);
    socketService.on('message_received', handleMessageReceived);

    return () => {
      socketService.off('notification_new', handleNewNotification);
      socketService.off('wallet_updated', handleWalletUpdated);
      socketService.off('topup_success', handleTopupSuccess);
      socketService.off('transaction_updated', handleTransactionUpdated);
      socketService.off('chat_updated', handleChatUpdated);
      socketService.off('message_received', handleMessageReceived);
    };
  }, [
    currentUser?.id,
    refreshTransactions,
    refreshChats,
    refreshNotifications,
    refreshUser,
    refreshProducts,
    showToast,
  ]);

  const unreadNotifCount = notifications.filter(
    (n) => !n.isRead && n.type !== 'chat_message'
  ).length;

  const unreadChatCount = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        products,
        productsLoading,
        transactions,
        chats,
        notifications,
        unreadNotifCount,
        unreadChatCount,
        theme,
        toggleTheme,
        onboardingOpen,
        setOnboardingOpen,
        toast,
        showToast,
        dismissToast,
        refreshUser,
        refreshProducts,
        refreshTransactions,
        refreshChats,
        refreshNotifications,
        setCurrentUser,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
