// d:\Kindr\web\src\services\domainServices.ts
import { api, setAuthTokens, clearAuthTokens, getRefreshToken } from './api';
import { socketService } from './socketService';
import {
  User,
  Product,
  Transaction,
  ChatSession,
  Message,
  NotificationItem,
  RatingItem,
  TopupOrderData,
  WithdrawRequestItem,
  ReportItem,
  CategoryItem,
  WaitlistEntry,
} from '../types';

export function normalizeUser(raw: any): User {
  return {
    ...raw,
    id: (raw.id || raw._id || '').toString(),
    xuBalance: raw.xuBalance ?? 0,
    xuFrozen: raw.xuFrozen ?? 0,
    welcomeCreditRemaining: raw.welcomeCreditRemaining ?? 0,
    civilizationPoints: raw.civilizationPoints ?? 95,
    tradesCount: raw.tradesCount ?? 0,
    reputationScore: raw.reputationScore ?? 5.0,
    ratingCount: raw.ratingCount ?? 0,
    isLocked: Boolean(raw.isLocked),
    disputeStrikeCount: raw.disputeStrikeCount ?? 0,
    role: raw.role || 'user',
  };
}

export function normalizeProduct(raw: any): Product {
  const sellerObj = raw.sellerId && typeof raw.sellerId === 'object' ? raw.sellerId : null;
  return {
    ...raw,
    id: (raw.id || raw._id || '').toString(),
    sellerId: (sellerObj?._id || sellerObj?.id || raw.sellerId || '').toString(),
    sellerName: sellerObj?.name || raw.sellerName || 'Mẹ Bỉm Kindr',
    sellerAvatar: sellerObj?.avatar || raw.sellerAvatar || '',
    sellerPhone: raw.sellerPhone || sellerObj?.phone || '',
    safeFeeLocked: raw.safeFeeLocked ?? 0,
  };
}

export function normalizeTransaction(raw: any): Transaction {
  return {
    ...raw,
    id: (raw.id || raw._id || '').toString(),
    productId: (raw.productId?._id || raw.productId?.id || raw.productId || '').toString(),
    buyerId: (raw.buyerId?._id || raw.buyerId?.id || raw.buyerId || '').toString(),
    sellerId: (raw.sellerId?._id || raw.sellerId?.id || raw.sellerId || '').toString(),
  };
}

export function normalizeChat(raw: any): ChatSession {
  return {
    ...raw,
    id: (raw.id || raw._id || '').toString(),
    productId: (raw.productId?._id || raw.productId || '').toString(),
    buyerId: (raw.buyerId?._id || raw.buyerId || '').toString(),
    sellerId: (raw.sellerId?._id || raw.sellerId || '').toString(),
    unreadCount: raw.unreadCount ?? 0,
  };
}

export function normalizeNotification(raw: any): NotificationItem {
  return {
    ...raw,
    id: (raw.id || raw._id || '').toString(),
    userId: (raw.userId?._id || raw.userId || '').toString(),
    relatedTransactionId: raw.relatedTransactionId
      ? raw.relatedTransactionId.toString()
      : raw.data?.transactionId,
    relatedProductId: raw.relatedProductId
      ? raw.relatedProductId.toString()
      : raw.data?.productId,
  };
}

export const authApi = {
  async login(phoneOrEmail: string, password: string) {
    const res = await api.post('/auth/login', { phone: phoneOrEmail, password });
    if (res.data.accessToken && res.data.refreshToken) {
      setAuthTokens(res.data.accessToken, res.data.refreshToken);
      socketService.connect();
    }
    return {
      user: normalizeUser(res.data.user),
      accessToken: res.data.accessToken,
    };
  },

  async demoLogin() {
    const res = await api.post('/auth/demo-login');
    if (res.data.accessToken && res.data.refreshToken) {
      setAuthTokens(res.data.accessToken, res.data.refreshToken);
      socketService.connect();
    }
    return normalizeUser(res.data.user);
  },

  async googleLogin(payload: {
    credential?: string;
    idToken?: string;
    googleId?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }) {
    const res = await api.post('/auth/google', payload);
    if (res.data.accessToken && res.data.refreshToken) {
      setAuthTokens(res.data.accessToken, res.data.refreshToken);
      socketService.connect();
    }
    return {
      user: normalizeUser(res.data.user),
      isNewUser: Boolean(res.data.isNewUser),
      message: res.data.message as string | undefined,
    };
  },

  async register(payload: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    location?: {
      districtId: string;
      districtName: string;
      addressDetail: string;
    };
  }) {
    const res = await api.post('/auth/register', payload);
    if (res.data.accessToken && res.data.refreshToken) {
      setAuthTokens(res.data.accessToken, res.data.refreshToken);
      socketService.connect();
    }
    return {
      needsActivation: Boolean(res.data.needsActivation),
      email: res.data.email as string | undefined,
      devOtp: res.data.devOtp as string | undefined,
      user: res.data.user ? normalizeUser(res.data.user) : null,
      message: res.data.message as string | undefined,
    };
  },

  async activateAccount(email: string, otp: string) {
    const res = await api.post('/auth/activate-account', { email, otp });
    if (res.data.accessToken && res.data.refreshToken) {
      setAuthTokens(res.data.accessToken, res.data.refreshToken);
      socketService.connect();
    }
    return normalizeUser(res.data.user);
  },

  async resendActivation(email: string) {
    const res = await api.post('/auth/resend-activation', { email });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return normalizeUser(res.data.user || res.data);
  },

  async updateProfile(payload: Partial<User>) {
    const res = await api.put('/auth/profile', payload);
    return normalizeUser(res.data.user || res.data);
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const res = await api.put('/auth/change-password', { oldPassword, newPassword });
    return res.data;
  },

  async sendForgotPasswordOtp(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async verifyForgotOtp(email: string, otp: string) {
    const res = await api.post('/auth/verify-otp', { email, otp });
    return res.data;
  },

  async resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
    const res = await api.post('/auth/reset-password', { email, otp, newPassword });
    return res.data;
  },

  async deleteAccount() {
    const res = await api.delete('/auth/me');
    socketService.disconnect();
    clearAuthTokens();
    return res.data;
  },

  async logout() {
    try {
      const refreshToken = getRefreshToken();
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore logout network error
    }
    socketService.disconnect();
    clearAuthTokens();
  },
};

export const productApi = {
  async getProducts(params?: Record<string, any>): Promise<Product[]> {
    const res = await api.get('/products', { params });
    const list = res.data.products || res.data || [];
    return Array.isArray(list) ? list.map(normalizeProduct) : [];
  },

  async getMyProducts(): Promise<Product[]> {
    const res = await api.get('/products/my');
    const list = res.data.products || res.data || [];
    return Array.isArray(list) ? list.map(normalizeProduct) : [];
  },

  async getProductById(id: string): Promise<Product> {
    const res = await api.get(`/products/${id}`);
    return normalizeProduct(res.data.product || res.data);
  },

  async createProduct(payload: {
    name: string;
    price: number;
    condition: string;
    conditionLabel: string;
    category: string;
    ageRange?: string;
    locationName: string;
    wardId?: string;
    districtId?: string;
    coordinates?: { latitude: number; longitude: number };
    image: string;
    additionalImages?: string[];
    description: string;
  }): Promise<{ product: Product; message: string }> {
    const res = await api.post('/products', payload);
    return {
      product: normalizeProduct(res.data.product || res.data),
      message: res.data.message || 'Đăng đồ thành công!',
    };
  },

  async updateProduct(id: string, payload: Record<string, any>): Promise<Product> {
    const res = await api.put(`/products/${id}`, payload);
    return normalizeProduct(res.data.product || res.data);
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  async aiSuggest(payload: {
    itemName: string;
    selectedCategory?: string;
    selectedCondition?: string;
  }): Promise<{
    category: string;
    condition: string;
    ageRange: string;
    suggestedXu: number;
    description: string;
  }> {
    const res = await api.post('/products/ai-suggest', payload);
    return res.data;
  },
};

export const transactionApi = {
  async createTransaction(productId: string): Promise<Transaction> {
    const res = await api.post('/transactions', { productId });
    return normalizeTransaction(res.data.transaction || res.data);
  },

  async getMyTransactions(): Promise<Transaction[]> {
    const res = await api.get('/transactions/my');
    const list = res.data.transactions || res.data || [];
    return Array.isArray(list) ? list.map(normalizeTransaction) : [];
  },

  async getTransactionById(id: string): Promise<Transaction> {
    const res = await api.get(`/transactions/${id}`);
    return normalizeTransaction(res.data.transaction || res.data);
  },

  async confirmHandover(id: string, handoverCode?: string) {
    const res = await api.post(`/transactions/${id}/handover`, {
      handoverCode: handoverCode ? handoverCode.trim().toUpperCase() : undefined,
    });
    return res.data;
  },

  async completeTransaction(id: string) {
    const res = await api.post(`/transactions/${id}/complete`);
    return res.data;
  },

  async fileDispute(id: string, reason: string, evidenceImages: string[] = []) {
    const res = await api.post(`/transactions/${id}/dispute`, {
      reason,
      evidenceImages,
    });
    return res.data;
  },

  async cancelTransaction(id: string, reason?: string) {
    const res = await api.post(`/transactions/${id}/cancel`, { reason });
    return res.data;
  },
};

export const walletApi = {
  async getBalance() {
    const res = await api.get('/wallet/balance');
    return res.data as {
      xuBalance: number;
      xuFrozen: number;
      welcomeCreditRemaining: number;
      totalXu: number;
    };
  },

  async createOrder(xuAmount: number): Promise<TopupOrderData> {
    const res = await api.post('/wallet/create-order', { xuAmount });
    return res.data.order || res.data;
  },

  async checkOrderStatus(orderCode: string) {
    const res = await api.get(`/wallet/orders/${orderCode}/status`);
    return res.data;
  },

  async simulateVietQrWebhook(orderCode: string) {
    const res = await api.post(`/wallet/orders/${orderCode}/simulate-webhook`);
    return res.data;
  },

  async demoTopup(xuAmount: number) {
    const res = await api.post('/wallet/topup', { xuAmount });
    return res.data;
  },

  async requestWithdraw(payload: {
    xuAmount: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) {
    const res = await api.post('/wallet/withdraw', payload);
    return res.data;
  },

  async getHistory(): Promise<{
    withdrawals: WithdrawRequestItem[];
    topups: TopupOrderData[];
  }> {
    const res = await api.get('/wallet/history');
    const list =
      res.data.withdrawRequests ||
      res.data.withdrawals ||
      res.data.history ||
      (Array.isArray(res.data) ? res.data : []);
    const topupList = res.data.topupOrders || res.data.topups || [];
    return {
      withdrawals: Array.isArray(list)
        ? list.map((w: any) => ({ ...w, id: (w.id || w._id || '').toString() }))
        : [],
      topups: Array.isArray(topupList)
        ? topupList.map((o: any) => ({ ...o, id: (o.id || o._id || o.orderCode || '').toString() }))
        : [],
    };
  },
};

export const chatApi = {
  async getChats(): Promise<ChatSession[]> {
    const res = await api.get('/chats');
    const list = res.data.chats || res.data || [];
    return Array.isArray(list) ? list.map(normalizeChat) : [];
  },

  async getChatById(chatId: string): Promise<ChatSession> {
    const res = await api.get(`/chats/${chatId}`);
    return normalizeChat(res.data.chat || res.data);
  },

  async getMessages(chatId: string, page = 1, limit = 60): Promise<Message[]> {
    const res = await api.get(`/chats/${chatId}/messages`, { params: { page, limit } });
    const list = res.data.messages || res.data || [];
    return Array.isArray(list)
      ? list.map((m: any) => ({
          ...m,
          id: (m.id || m._id || '').toString(),
          chatId: (m.chatId || chatId).toString(),
          senderId: (m.senderId || '').toString(),
          timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
        }))
      : [];
  },

  async createChat(productId: string, sellerId: string): Promise<ChatSession> {
    const res = await api.post('/chats', { productId, sellerId });
    return normalizeChat(res.data.chat || res.data);
  },

  async sendMessage(chatId: string, content: string): Promise<Message> {
    const res = await api.post(`/chats/${chatId}/messages`, { content });
    const m = res.data.message || res.data;
    return {
      ...m,
      id: (m.id || m._id || '').toString(),
      chatId: (m.chatId || chatId).toString(),
      senderId: (m.senderId || '').toString(),
      timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
    };
  },
};

export const notificationApi = {
  async getNotifications(page = 1, limit = 30): Promise<NotificationItem[]> {
    const res = await api.get('/notifications', { params: { page, limit } });
    const list = res.data.notifications || res.data || [];
    return Array.isArray(list) ? list.map(normalizeNotification) : [];
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.unreadCount ?? res.data.count ?? 0;
  },

  async markAsRead(id: string) {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    await api.put('/notifications/read-all');
  },
};

export const ratingApi = {
  async submitRating(payload: {
    transactionId: string;
    stars: number;
    comment: string;
    tags?: string[];
  }) {
    const res = await api.post('/ratings', payload);
    return res.data;
  },

  async getUserRatings(userId: string): Promise<{
    ratings: RatingItem[];
    averageStars: number;
    totalRatings: number;
  }> {
    const res = await api.get(`/ratings/user/${userId}`);
    const list = res.data.ratings || res.data || [];
    return {
      ratings: Array.isArray(list)
        ? list.map((r: any) => ({ ...r, id: (r.id || r._id || '').toString() }))
        : [],
      averageStars: res.data.averageStars ?? 5.0,
      totalRatings: res.data.totalRatings ?? list.length,
    };
  },
};

export const reportApi = {
  async submitReport(payload: {
    targetType: 'user' | 'product' | 'transaction';
    targetId: string;
    reason: string;
  }) {
    const res = await api.post('/reports', payload);
    return res.data;
  },

  async getMyReports(): Promise<ReportItem[]> {
    const res = await api.get('/reports/my');
    const list = res.data.reports || res.data || [];
    return Array.isArray(list)
      ? list.map((r: any) => ({ ...r, id: (r.id || r._id || '').toString() }))
      : [];
  },
};

export const uploadApi = {
  async uploadBase64Image(base64OrUrl: string, folder = 'kindr/products'): Promise<string> {
    try {
      const res = await api.post('/upload', { image: base64OrUrl, folder });
      return res.data.url || base64OrUrl;
    } catch {
      return base64OrUrl;
    }
  },
};

export const adminApi = {
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res.data as {
      totalUsers: number;
      totalProducts: number;
      totalTransactions: number;
      pendingProducts: number;
      pendingDisputes: number;
      pendingWithdraws: number;
      openReports: number;
      escrowLockedXu: number;
    };
  },

  async getUsers(search?: string): Promise<User[]> {
    const res = await api.get('/admin/users', { params: { search, limit: 100 } });
    const list = res.data.users || res.data || [];
    return Array.isArray(list) ? list.map(normalizeUser) : [];
  },

  async lockUser(userId: string) {
    return (await api.put(`/admin/users/${userId}/lock`)).data;
  },

  async unlockUser(userId: string) {
    return (await api.put(`/admin/users/${userId}/unlock`)).data;
  },

  async updateUserRole(userId: string, role: 'user' | 'admin') {
    return (await api.put(`/admin/users/${userId}/role`, { role })).data;
  },

  async getProducts(status?: string): Promise<Product[]> {
    const res = await api.get('/admin/products', { params: { status } });
    const list = res.data.products || res.data || [];
    return Array.isArray(list) ? list.map(normalizeProduct) : [];
  },

  async approveProduct(productId: string) {
    return (await api.put(`/admin/products/${productId}/approve`)).data;
  },

  async removeProduct(productId: string) {
    return (await api.delete(`/admin/products/${productId}`)).data;
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await api.get('/admin/transactions', { params: { limit: 100 } });
    const list = res.data.transactions || res.data || [];
    return Array.isArray(list) ? list.map(normalizeTransaction) : [];
  },

  async getDisputes(): Promise<Transaction[]> {
    const res = await api.get('/admin/disputes');
    const list = res.data.disputes || res.data.transactions || res.data || [];
    return Array.isArray(list) ? list.map(normalizeTransaction) : [];
  },

  async resolveDispute(txId: string, outcome: 'resolved_buyer' | 'resolved_seller') {
    return (await api.put(`/admin/disputes/${txId}/resolve`, { outcome })).data;
  },

  async getWithdraws(status = 'all'): Promise<WithdrawRequestItem[]> {
    const res = await api.get('/admin/withdraws', { params: { status } });
    const list = res.data.withdrawRequests || res.data.withdraws || res.data || [];
    return Array.isArray(list)
      ? list.map((w: any) => ({
          ...w,
          id: (w.id || w._id || '').toString(),
          userName: w.accountHolder || w.userId?.name || w.userName || 'Thành viên Kindr',
        }))
      : [];
  },

  async approveWithdraw(id: string) {
    return (await api.put(`/admin/withdraws/${id}/approve`)).data;
  },

  async rejectWithdraw(id: string, adminNote?: string) {
    return (await api.put(`/admin/withdraws/${id}/reject`, { adminNote })).data;
  },

  async getReports(status = 'all'): Promise<ReportItem[]> {
    const res = await api.get('/admin/reports', { params: { status, limit: 50 } });
    const list = res.data.reports || res.data || [];
    return Array.isArray(list)
      ? list.map((r: any) => ({ ...r, id: (r.id || r._id || '').toString() }))
      : [];
  },

  async updateReport(id: string, status: 'reviewed' | 'dismissed', adminNote?: string) {
    return (await api.put(`/admin/reports/${id}`, { status, adminNote })).data;
  },

  async getCategories(): Promise<CategoryItem[]> {
    const res = await api.get('/categories');
    const list = res.data.categories || res.data || [];
    return Array.isArray(list)
      ? list.map((c: any) => ({ ...c, id: (c.id || c._id || '').toString() }))
      : [];
  },

  async createCategory(name: string, code: string) {
    return (await api.post('/categories', { name, code })).data;
  },

  async deleteCategory(id: string) {
    return (await api.delete(`/categories/${id}`)).data;
  },

  async getWaitlistEntries(): Promise<{ entries: WaitlistEntry[]; total: number }> {
    const res = await api.get('/waitlist/entries', { params: { limit: 200 } });
    const list = res.data.entries || res.data || [];
    return {
      entries: Array.isArray(list)
        ? list.map((e: any) => ({ ...e, id: (e.id || e._id || '').toString() }))
        : [],
      total: res.data.total ?? list.length,
    };
  },

  async getSurveySummary(): Promise<{
    total: number;
    hasItemsToDeclutter: number;
    fearsFacebookScams: number;
    findsAppUseful: number;
    willingToRefer: number;
    saveMoney: number;
    declutter: number;
    newItems: number;
  }> {
    const res = await api.get('/survey/summary');
    const d = res.data?.data || res.data || {};
    return {
      total: d.total || 0,
      hasItemsToDeclutter: d.hasItemsToDeclutter || 0,
      fearsFacebookScams: d.fearsFacebookScams || 0,
      findsAppUseful: d.findsAppUseful || 0,
      willingToRefer: d.willingToRefer || 0,
      saveMoney: d.saveMoney || 0,
      declutter: d.declutter || 0,
      newItems: d.newItems || 0,
    };
  },
};

export const surveyApi = {
  async getStats(): Promise<{
    total: number;
    waiverSlots: number;
    waiverRemaining: number;
  }> {
    const res = await api.get('/survey/stats');
    const d = res.data?.data || res.data || {};
    return {
      total: d.total ?? 0,
      waiverSlots: d.waiverSlots ?? 50,
      waiverRemaining: d.waiverRemaining ?? 50,
    };
  },

  async submitSurvey(payload: {
    phone: string;
    hasItemsToDeclutter?: boolean;
    motivation?: 'save_money' | 'declutter' | 'new_items';
    fearsFacebookScams?: boolean;
    findsAppUseful?: boolean;
    referralIntent?: 'willing' | 'try_first';
  }): Promise<{
    message: string;
    credited?: boolean;
    rewardCode?: string;
    starterXu?: number;
    safeFeeWaiver?: boolean;
  }> {
    const res = await api.post('/survey', {
      campaign: 'fpt_plaza_popup',
      phone: payload.phone,
      hasItemsToDeclutter: payload.hasItemsToDeclutter ?? true,
      motivation: payload.motivation || 'declutter',
      fearsFacebookScams: payload.fearsFacebookScams ?? true,
      findsAppUseful: payload.findsAppUseful ?? true,
      referralIntent: payload.referralIntent || 'willing',
      consent: true,
    });
    return {
      message: res.data.message || 'Cảm ơn mẹ đã hoàn thành khảo sát!',
      credited: !res.data.alreadySubmitted,
      rewardCode: res.data.data?.rewardCode,
      starterXu: res.data.data?.starterXu ?? 5,
      safeFeeWaiver: res.data.data?.safeFeeWaiver,
    };
  },
};

export const waitlistApi = {
  async getStats(): Promise<{
    totalRegistered: number;
    remainingSlots: number;
  }> {
    const res = await api.get('/waitlist/stats');
    const total = res.data?.total ?? res.data?.data?.total ?? 32;
    const remaining = res.data?.remaining ?? res.data?.data?.remaining ?? Math.max(0, 200 - total);
    return {
      totalRegistered: total,
      remainingSlots: remaining,
    };
  },

  async register(payload: {
    parentName?: string;
    phone: string;
    email: string;
    userRole?: 'mom' | 'genz';
    interest?: 'Đồ chơi vận động' | 'Xe đẩy, nôi cũi' | 'Quần áo Nous/cotton' | 'Sách Ehon';
  }): Promise<{
    message: string;
    slotNumber?: number;
    memberCode?: string;
  }> {
    const res = await api.post('/waitlist', {
      email: payload.email,
      phone: payload.phone,
      userRole: payload.userRole || 'mom',
      interest: payload.interest || 'Đồ chơi vận động',
      consent: true,
    });
    const orderNum = res.data?.orderNumber ?? res.data?.data?.orderNumber ?? 1;
    return {
      message: res.data?.message || 'Đăng ký giữ chỗ Top 200 Tiên Phong thành công!',
      slotNumber: orderNum,
      memberCode: `KINDR-#${orderNum}`,
    };
  },
};


