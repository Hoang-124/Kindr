// src/types/report.ts

export interface Report {
  id: string;
  targetType: 'post' | 'user';
  targetId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: 'open' | 'reviewed' | 'dismissed' | 'upheld';
  createdAt: string;
}
