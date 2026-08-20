// src/features/auth/store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, CivilizationHistoryLog } from '../../../types/user';
import { DEFAULT_IMAGES } from '../../../utils/constants';
import * as authService from '../../../services/authService';
import * as walletService from '../../../services/walletService';

export interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  xuAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AuthState {
  currentUser: User | null;
  allUsers: User[];
  withdrawRequests: WithdrawRequest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  allUsers: [],
  withdrawRequests: [],
  isLoading: false,
  error: null,
};

// ---- Async Thunks ----

export const loginAsync = createAsyncThunk(
  'auth/loginAsync',
  async ({ phone, password }: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(phone, password);
      const user = response.user;
      return {
        ...user,
        id: (user as any)._id?.toString() || user.id,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Đăng nhập không thành công');
    }
  }
);

export const registerAsync = createAsyncThunk(
  'auth/registerAsync',
  async (payload: authService.RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await authService.register(payload);
      const user = response.user;
      return {
        ...user,
        id: (user as any)._id?.toString() || user.id,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Đăng ký không thành công');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getMe();
      return {
        ...user,
        id: (user as any)._id?.toString() || user.id,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Phiên đăng nhập hết hạn');
    }
  }
);

export const logoutAsync = createAsyncThunk('auth/logoutAsync', async () => {
  await authService.logout();
  return null;
});

export const refreshWalletBalance = createAsyncThunk(
  'auth/refreshWalletBalance',
  async (_, { rejectWithValue }) => {
    try {
      const balance = await walletService.getWalletBalance();
      return balance;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Không thể lấy số dư ví');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state, action: PayloadAction<string>) => {
      const user = state.allUsers.find(u => u.id === action.payload);
      if (user) {
        state.currentUser = user;
      }
    },
    registerUser: (state, action: PayloadAction<Omit<User, 'xuBalance' | 'xuFrozen' | 'welcomeCreditRemaining' | 'civilizationPoints' | 'historyPoints' | 'tradesCount' | 'reputationScore' | 'ratingCount' | 'isLocked' | 'disputeStrikeCount'>>) => {
      const newUser: User = {
        ...action.payload,
        xuBalance: 10,
        xuFrozen: 0,
        welcomeCreditRemaining: 10,
        civilizationPoints: 95,
        tradesCount: 0,
        reputationScore: 5.0,
        ratingCount: 0,
        isLocked: false,
        disputeStrikeCount: 0,
        historyPoints: [
          { id: Math.random().toString(), pointsChanged: 95, reason: 'Chào mừng gia nhập cộng đồng Kindr (Tặng 10 Xu chào mừng)', date: new Date().toISOString() }
        ]
      };
      state.allUsers.push(newUser);
      state.currentUser = newUser;
    },
    updateUserBalance: (state, action: PayloadAction<{ userId: string; amount: number }>) => {
      const { userId, amount } = action.payload;
      const user = state.allUsers.find(u => u.id === userId);
      if (user) {
        user.xuBalance = Math.max(0, user.xuBalance + amount);
        if (state.currentUser?.id === userId) {
          state.currentUser.xuBalance = user.xuBalance;
        }
      }
    },
    updateUserFrozenXu: (state, action: PayloadAction<{ userId: string; amount: number }>) => {
      const { userId, amount } = action.payload;
      const user = state.allUsers.find(u => u.id === userId);
      if (user) {
        user.xuFrozen = Math.max(0, (user.xuFrozen || 0) + amount);
        if (state.currentUser?.id === userId) {
          state.currentUser.xuFrozen = user.xuFrozen;
        }
      }
    },
    updateUserReputation: (state, action: PayloadAction<{ userId: string; newStars: number }>) => {
      const { userId, newStars } = action.payload;
      const user = state.allUsers.find(u => u.id === userId);
      if (user) {
        const totalRatingSum = (user.reputationScore || 5.0) * (user.ratingCount || 0) + newStars;
        user.ratingCount = (user.ratingCount || 0) + 1;
        user.reputationScore = Number((totalRatingSum / user.ratingCount).toFixed(1));
        user.tradesCount = (user.tradesCount || 0) + 1;
        if (state.currentUser?.id === userId) {
          state.currentUser.ratingCount = user.ratingCount;
          state.currentUser.reputationScore = user.reputationScore;
          state.currentUser.tradesCount = user.tradesCount;
        }
      }
    },
    addStrikeToUser: (state, action: PayloadAction<{ userId: string; reason: string }>) => {
      const { userId, reason } = action.payload;
      const user = state.allUsers.find(u => u.id === userId);
      if (user) {
        user.disputeStrikeCount = (user.disputeStrikeCount || 0) + 1;
        user.civilizationPoints = Math.max(0, user.civilizationPoints - 15);
        user.historyPoints.unshift({
          id: Math.random().toString(),
          pointsChanged: -15,
          reason: `Vi phạm khiếu nại: ${reason}`,
          date: new Date().toISOString(),
        });
        if (user.disputeStrikeCount >= 3) {
          user.isLocked = true;
        }
        if (state.currentUser?.id === userId) {
          state.currentUser.disputeStrikeCount = user.disputeStrikeCount;
          state.currentUser.civilizationPoints = user.civilizationPoints;
          state.currentUser.isLocked = user.isLocked;
        }
      }
    },
    adjustCivilizationPoints: (state, action: PayloadAction<{ userId: string; points: number; reason: string }>) => {
      const { userId, points, reason } = action.payload;
      const user = state.allUsers.find(u => u.id === userId);
      if (user) {
        user.civilizationPoints = Math.min(100, Math.max(0, user.civilizationPoints + points));
        const newLog: CivilizationHistoryLog = {
          id: Math.random().toString(),
          pointsChanged: points,
          reason,
          date: new Date().toISOString(),
        };
        user.historyPoints.unshift(newLog);
        if (state.currentUser?.id === userId) {
          state.currentUser.civilizationPoints = user.civilizationPoints;
          state.currentUser.historyPoints = user.historyPoints;
        }
      }
    },
    addWithdrawRequest: (state, action: PayloadAction<WithdrawRequest>) => {
      state.withdrawRequests.unshift(action.payload);
      const user = state.allUsers.find(u => u.id === action.payload.userId);
      if (user) {
        user.xuBalance = Math.max(0, user.xuBalance - action.payload.xuAmount);
        if (state.currentUser?.id === user.id) {
          state.currentUser.xuBalance = user.xuBalance;
        }
      }
    },
    updateWithdrawRequestStatus: (state, action: PayloadAction<{ id: string; status: 'approved' | 'rejected' }>) => {
      const { id, status } = action.payload;
      const request = state.withdrawRequests.find(r => r.id === id);
      if (request && request.status === 'pending') {
        request.status = status;
        if (status === 'rejected') {
          const user = state.allUsers.find(u => u.id === request.userId);
          if (user) {
            user.xuBalance += request.xuAmount;
            if (state.currentUser?.id === user.id) {
              state.currentUser.xuBalance = user.xuBalance;
            }
          }
        }
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // loginAsync
    builder.addCase(loginAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentUser = action.payload;
    });
    builder.addCase(loginAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Đăng nhập thất bại';
    });

    // registerAsync
    builder.addCase(registerAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentUser = action.payload;
      state.allUsers.push(action.payload);
    });
    builder.addCase(registerAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Đăng ký thất bại';
    });

    // fetchCurrentUser
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.currentUser = action.payload;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      // If token expired / invalid, reset currentUser
      state.currentUser = null;
    });

    // logoutAsync
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.currentUser = null;
    });

    // refreshWalletBalance
    builder.addCase(refreshWalletBalance.fulfilled, (state, action) => {
      if (state.currentUser) {
        state.currentUser.xuBalance = action.payload.xuBalance;
        state.currentUser.xuFrozen = action.payload.xuFrozen;
        state.currentUser.welcomeCreditRemaining = action.payload.welcomeCreditRemaining;
      }
    });
  },
});

export const { 
  loginUser, 
  registerUser, 
  updateUserBalance, 
  updateUserFrozenXu,
  updateUserReputation,
  addStrikeToUser,
  adjustCivilizationPoints, 
  addWithdrawRequest,
  updateWithdrawRequestStatus,
  clearAuthError
} = authSlice.actions;

export default authSlice.reducer;
