// src/features/exchange/store/exchangeSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../../types/common';
import { generateTransactionQRCode } from '../../../utils/helpers';
import { pushService } from '../../../services/notifications/pushService';
import * as transactionService from '../../../services/transactionService';

interface ExchangeState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExchangeState = {
  transactions: [],
  isLoading: false,
  error: null,
};

// ---- Async Thunks ----

export const fetchMyTransactionsAsync = createAsyncThunk(
  'exchange/fetchMyTransactionsAsync',
  async (_, { rejectWithValue }) => {
    try {
      const txs = await transactionService.getMyTransactions();
      return txs;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Không thể tải danh sách giao dịch');
    }
  }
);

export const initiateExchangeAsync = createAsyncThunk(
  'exchange/initiateExchangeAsync',
  async (productId: string, { rejectWithValue }) => {
    try {
      const result = await transactionService.createTransaction(productId);
      return result.transaction;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Tạo giao dịch đổi đồ thất bại');
    }
  }
);

export const confirmHandoverAsync = createAsyncThunk(
  'exchange/confirmHandoverAsync',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      await transactionService.confirmHandover(transactionId);
      return { transactionId };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Không thể xác nhận bàn giao');
    }
  }
);

export const completeTransactionAsync = createAsyncThunk(
  'exchange/completeTransactionAsync',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      await transactionService.completeTransaction(transactionId);
      return { transactionId };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Không thể hoàn tất giao dịch');
    }
  }
);

export const fileDisputeAsync = createAsyncThunk(
  'exchange/fileDisputeAsync',
  async (
    { transactionId, reason, evidenceImages }: { transactionId: string; reason: string; evidenceImages?: string[] },
    { rejectWithValue }
  ) => {
    try {
      await transactionService.fileDispute(transactionId, reason, evidenceImages);
      return { transactionId, reason, evidenceImages };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Không thể gửi khiếu nại');
    }
  }
);

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    createTransaction: (state, action: PayloadAction<Omit<Transaction, 'qrCodePayload'>>) => {
      const newTx: Transaction = {
        ...action.payload,
        status: action.payload.status || 'awaiting_handover',
        qrCodePayload: generateTransactionQRCode(action.payload.id),
      };
      state.transactions.unshift(newTx);

      pushService.notifyUser(
        newTx.sellerId,
        'match_request',
        'Có mẹ vừa chọn đổi đồ của bạn! ❤️',
        `${newTx.buyerName} vừa bấm đổi món: ${newTx.productName}. Kiểm tra liên hệ để hẹn gặp nhé!`,
        newTx.id,
        newTx.productId
      );
    },

    updateTransactionStatus: (state, action: PayloadAction<{ transactionId: string; status: Transaction['status']; finalizedAt?: string }>) => {
      const { transactionId, status, finalizedAt } = action.payload;
      const tx = state.transactions.find(t => t.id === transactionId);
      if (tx) {
        tx.status = status;
        if (finalizedAt) {
          tx.finalizedAt = finalizedAt;
        }
      }
    },

    confirmHandover: (state, action: PayloadAction<{ transactionId: string }>) => {
      const tx = state.transactions.find(t => t.id === action.payload.transactionId);
      if (tx && (tx.status === 'awaiting_handover' || tx.status === 'frozen' || tx.status === 'shipped')) {
        const sixHoursLater = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
        tx.status = 'in_safeful_time';
        tx.handoverTime = new Date().toISOString();
        tx.safefulTimeExpiresAt = sixHoursLater;

        pushService.notifyUser(
          tx.buyerId,
          'safeful_time_started',
          'Đã kích hoạt 6 Giờ Kiểm Định! ⏱️',
          `Bạn có 6 tiếng kiểm tra đồ "${tx.productName}" tại nhà. Nếu có lỗi ẩn, hãy bấm Khiếu nại nhé!`,
          tx.id
        );

        pushService.notifyUser(
          tx.sellerId,
          'safeful_time_started',
          'Người mua đã nhận hàng! 📦',
          `Khung giờ 6h kiểm định tại nhà bắt đầu. Xu sẽ tự động giải phóng khi hết 6 giờ.`,
          tx.id
        );
      }
    },

    finalizeSafefulTime: (state, action: PayloadAction<{ transactionId: string }>) => {
      const tx = state.transactions.find(t => t.id === action.payload.transactionId);
      if (tx && (tx.status === 'in_safeful_time' || tx.status === 'awaiting_handover')) {
        tx.status = 'completed';
        tx.finalizedAt = new Date().toISOString();

        pushService.notifyUser(
          tx.sellerId,
          'xu_released',
          'Giao dịch hoàn tất! Xu đã vào ví 🟡',
          `Hệ thống đã giải phóng ${tx.buyerEscrowFrozen + tx.sellerEscrowFrozen} Xu vào ví của mẹ. Đừng quên đánh giá nhé!`,
          tx.id
        );

        pushService.notifyUser(
          tx.buyerId,
          'xu_released',
          'Giao dịch thành công! 🎉',
          `Cảm ơn mẹ đã sử dụng Kindr. Hãy dành 30s đánh giá cho ${tx.sellerName} nhé!`,
          tx.id
        );
      }
    },

    fileDispute: (state, action: PayloadAction<{ transactionId: string; reason: string; evidenceImages?: string[] }>) => {
      const { transactionId, reason, evidenceImages } = action.payload;
      const tx = state.transactions.find(t => t.id === transactionId);
      if (tx) {
        tx.status = 'disputed';
        tx.disputeReason = reason;
        tx.disputeEvidenceImages = evidenceImages;
        tx.evidenceImages = evidenceImages;
        tx.disputeStatus = 'open';

        pushService.notifyUser(
          tx.sellerId,
          'dispute_opened',
          'Có khiếu nại mới cho đơn hàng! ⚠️',
          `Người mua đã báo lỗi món "${tx.productName}". Đội ngũ Kindr đang kiểm tra chứng cứ.`,
          tx.id
        );
      }
    },

    resolveDispute: (state, action: PayloadAction<{ transactionId: string; outcome: 'resolved_buyer' | 'resolved_seller' }>) => {
      const { transactionId, outcome } = action.payload;
      const tx = state.transactions.find(t => t.id === transactionId);
      if (tx && tx.status === 'disputed') {
        tx.disputeStatus = outcome;
        tx.status = outcome === 'resolved_buyer' ? 'refunded' : 'completed';
        tx.finalizedAt = new Date().toISOString();

        const notifMsg = outcome === 'resolved_buyer' 
          ? 'Khiếu nại được chấp thuận: Xu đã hoàn về ví người mua.'
          : 'Khiếu nại bác bỏ: Xu đã giải phóng cho người bán.';

        pushService.notifyUser(tx.buyerId, 'dispute_resolved', 'Kết quả xử lý khiếu nại', notifMsg, tx.id);
        pushService.notifyUser(tx.sellerId, 'dispute_resolved', 'Kết quả xử lý khiếu nại', notifMsg, tx.id);
      }
    },

    markRated: (state, action: PayloadAction<{ transactionId: string; isBuyer: boolean }>) => {
      const tx = state.transactions.find(t => t.id === action.payload.transactionId);
      if (tx) {
        if (action.payload.isBuyer) {
          tx.buyerRated = true;
        } else {
          tx.sellerRated = true;
        }
      }
    },

    hydrateTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchMyTransactionsAsync
    builder.addCase(fetchMyTransactionsAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMyTransactionsAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.transactions = action.payload || [];
    });
    builder.addCase(fetchMyTransactionsAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Lỗi tải giao dịch';
    });

    // initiateExchangeAsync
    builder.addCase(initiateExchangeAsync.fulfilled, (state, action) => {
      state.transactions.unshift(action.payload);
    });

    // confirmHandoverAsync
    builder.addCase(confirmHandoverAsync.fulfilled, (state, action) => {
      const tx = state.transactions.find(t => t.id === action.payload.transactionId);
      if (tx) {
        tx.status = 'in_safeful_time';
        tx.handoverTime = new Date().toISOString();
        tx.safefulTimeExpiresAt = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
      }
    });

    // completeTransactionAsync
    builder.addCase(completeTransactionAsync.fulfilled, (state, action) => {
      const tx = state.transactions.find(t => t.id === action.payload.transactionId);
      if (tx) {
        tx.status = 'completed';
        tx.finalizedAt = new Date().toISOString();
      }
    });

    // fileDisputeAsync
    builder.addCase(fileDisputeAsync.fulfilled, (state, action) => {
      const tx = state.transactions.find(t => t.id === action.payload.transactionId);
      if (tx) {
        tx.status = 'disputed';
        tx.disputeReason = action.payload.reason;
        tx.disputeEvidenceImages = action.payload.evidenceImages;
        tx.disputeStatus = 'open';
      }
    });
  },
});

export const { 
  createTransaction, 
  updateTransactionStatus,
  confirmHandover, 
  finalizeSafefulTime, 
  fileDispute, 
  resolveDispute, 
  markRated, 
  hydrateTransactions 
} = exchangeSlice.actions;

export default exchangeSlice.reducer;
