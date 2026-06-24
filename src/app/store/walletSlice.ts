// src/app/store/walletSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'earn' | 'spend' | 'escrow' | 'refund' | 'withdraw';
  amount: number;
  desc: string;
  date: string;
  status: 'completed' | 'holding' | 'pending';
}

export interface WalletState {
  balance: number;
  escrow: number;
  history: WalletTransaction[];
}

const initialState: WalletState = {
  balance: 15,
  escrow: 5,
  history: [
    { id: '1', type: 'deposit', amount: 10, desc: 'Nạp Xu lần đầu', date: '2024-01-10', status: 'completed' },
    { id: '2', type: 'earn', amount: 5, desc: 'Bán "Xe đẩy cũ"', date: '2024-01-15', status: 'completed' },
    { id: '3', type: 'spend', amount: -5, desc: 'Đổi "Sách vải Montessori"', date: '2024-01-18', status: 'completed' },
    { id: '4', type: 'deposit', amount: 10, desc: 'Nạp Xu bổ sung', date: '2024-01-25', status: 'completed' },
    { id: '5', type: 'escrow', amount: -5, desc: 'Gấu giữ Xu cho giao dịch #1024', date: '2024-02-01', status: 'holding' },
    { id: '6', type: 'refund', amount: 3, desc: 'Hoàn Xu từ khiếu nại #998', date: '2024-02-03', status: 'completed' },
  ],
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    depositXu: (state, action: PayloadAction<{ amount: number }>) => {
      state.balance += action.payload.amount;
      state.history.unshift({
        id: Date.now().toString(),
        type: 'deposit',
        amount: action.payload.amount,
        desc: `Nạp ${action.payload.amount} Xu`,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
    },
    spendXu: (state, action: PayloadAction<{ amount: number; itemName: string }>) => {
      if (state.balance >= action.payload.amount) {
        state.balance -= action.payload.amount;
        state.escrow += action.payload.amount;
        state.history.unshift({
          id: Date.now().toString(),
          type: 'escrow',
          amount: -action.payload.amount,
          desc: `Gấu giữ Xu cho "${action.payload.itemName}"`,
          date: new Date().toISOString().split('T')[0],
          status: 'holding',
        });
      }
    },
    earnXu: (state, action: PayloadAction<{ amount: number; itemName: string }>) => {
      state.balance += action.payload.amount;
      state.history.unshift({
        id: Date.now().toString(),
        type: 'earn',
        amount: action.payload.amount,
        desc: `Nhận Xu từ "${action.payload.itemName}"`,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
    },
    releaseEscrow: (state, action: PayloadAction<{ amount: number; itemName: string }>) => {
      state.escrow -= action.payload.amount;
      state.history.unshift({
        id: Date.now().toString(),
        type: 'earn',
        amount: action.payload.amount,
        desc: `Xu chuyển cho người đăng "${action.payload.itemName}"`,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
    },
    withdrawXu: (state, action: PayloadAction<{ amount: number }>) => {
      const fee = Math.ceil(action.payload.amount * 0.1);
      state.balance -= action.payload.amount;
      state.history.unshift({
        id: Date.now().toString(),
        type: 'withdraw',
        amount: -action.payload.amount,
        desc: `Rút ${action.payload.amount} Xu (phí ${fee} Xu)`,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
    },
    refundXu: (state, action: PayloadAction<{ amount: number; itemName: string }>) => {
      state.balance += action.payload.amount;
      state.escrow -= action.payload.amount;
      state.history.unshift({
        id: Date.now().toString(),
        type: 'refund',
        amount: action.payload.amount,
        desc: `Hoàn Xu từ khiếu nại "${action.payload.itemName}"`,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
    },
  },
});

export const { depositXu, spendXu, earnXu, releaseEscrow, withdrawXu, refundXu } = walletSlice.actions;
export default walletSlice.reducer;
