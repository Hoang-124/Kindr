// src/features/trust-safety/store/reportSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Report } from '../../../types/report';
import { api } from '../../../services/api';

export const submitReportAsync = createAsyncThunk(
  'report/submitReportAsync',
  async (
    payload: { targetType: 'user' | 'product' | 'transaction'; targetId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post('/reports', payload);
      return res.data.report as Report;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Không thể gửi báo cáo vi phạm');
    }
  }
);

interface ReportState {
  reports: Report[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  reports: [],
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    submitReport: (state, action: PayloadAction<Omit<Report, 'id' | 'status' | 'createdAt'>>) => {
      const newReport: Report = {
        ...action.payload,
        id: 'report_' + Math.random().toString(36).substring(2, 9),
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      state.reports.unshift(newReport);
    },
    updateReportStatus: (state, action: PayloadAction<{ id: string; status: Report['status'] }>) => {
      const report = state.reports.find(r => r.id === action.payload.id);
      if (report) {
        report.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitReportAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitReportAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.reports.unshift(action.payload);
        }
      })
      .addCase(submitReportAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Lỗi gửi báo cáo';
      });
  },
});

export const { submitReport, updateReportStatus } = reportSlice.actions;
export default reportSlice.reducer;
