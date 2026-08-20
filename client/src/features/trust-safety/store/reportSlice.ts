// src/features/trust-safety/store/reportSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Report } from '../../../types/report';

interface ReportState {
  reports: Report[];
}

const initialState: ReportState = {
  reports: [],
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
});

export const { submitReport, updateReportStatus } = reportSlice.actions;
export default reportSlice.reducer;
