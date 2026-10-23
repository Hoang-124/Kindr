// d:\Kindr\web\src\pages\NotificationsPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Wallet,
  Sparkles,
  Package,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { notificationApi } from '../services/domainServices';
import { NotificationItem } from '../types';

function formatNotifTime(iso?: string): string {
  if (!iso) return 'Vừa xong';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

type NotifFilter = 'all' | 'unread' | 'escrow' | 'wallet' | 'system';

export const NotificationsPage: React.FC = () => {
  const {
    currentUser,
    notifications,
    unreadNotifCount,
    refreshNotifications,
  } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotifFilter>('all');

  const filteredList = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.isRead;
      if (filter === 'escrow') {
        return ['match_request', 'safeful_time_started', 'dispute_opened', 'dispute_resolved'].includes(n.type);
      }
      if (filter === 'wallet') {
        return ['xu_released', 'welcome_credit'].includes(n.type);
      }
      if (filter === 'system') {
        return ['system', 'post_approved', 'post_rejected'].includes(n.type);
      }
      return true;
    });
  }, [notifications, filter]);

  const getNotifMeta = (type: NotificationItem['type']) => {
    switch (type) {
      case 'match_request':
        return {
          icon: <Package size={20} color="var(--color-primary)" />,
          bg: 'var(--color-primary-soft)',
          tag: 'Đơn đổi đồ mới',
        };
      case 'safeful_time_started':
        return {
          icon: <Clock size={20} color="var(--color-secondary)" />,
          bg: 'var(--color-secondary-soft)',
          tag: '6h Kiểm định',
        };
      case 'xu_released':
      case 'welcome_credit':
        return {
          icon: <Wallet size={20} color="var(--color-success)" />,
          bg: 'var(--color-success-bg)',
          tag: 'Biến động Ví Xu',
        };
      case 'dispute_opened':
      case 'dispute_resolved':
        return {
          icon: <AlertTriangle size={20} color="var(--color-warning)" />,
          bg: 'var(--color-warning-bg)',
          tag: 'Trọng tài Ký quỹ',
        };
      case 'post_approved':
      case 'post_rejected':
        return {
          icon: <ShieldCheck size={20} color="var(--color-info)" />,
          bg: 'var(--color-info-bg)',
          tag: 'Kiểm duyệt tin đăng',
        };
      default:
        return {
          icon: <Sparkles size={20} color="var(--color-primary)" />,
          bg: 'var(--color-primary-soft)',
          tag: 'Hệ thống Kindr',
        };
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      await refreshNotifications();
    } catch {
      // ignore
    }
  };

  const handleClickNotification = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await notificationApi.markAsRead(n.id);
        await refreshNotifications();
      } catch {
        // ignore
      }
    }
    if (n.relatedTransactionId) {
      navigate(`/transactions/${n.relatedTransactionId}`);
    } else if (n.relatedProductId) {
      navigate(`/products/${n.relatedProductId}`);
    } else if (n.type === 'xu_released' || n.type === 'welcome_credit') {
      navigate('/wallet');
    }
  };

  if (!currentUser) {
    return (
      <div className="kw-container" style={{ padding: '48px 16px' }}>
        <div className="kw-card" style={{ padding: 40, textAlign: 'center' }}>
          <Bell size={44} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Đăng nhập để xem Trung tâm Thông báo
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            Theo dõi biến động Xu, lịch hẹn bàn giao mã PIN và 6h kiểm định theo thời gian thực.
          </p>
          <button className="kw-btn kw-btn-primary" onClick={() => navigate('/login')}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kw-container" style={{ padding: '28px 16px 64px', maxWidth: 920 }}>
      {/* Header */}
      <div
        className="kw-card"
        style={{
          padding: 24,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'var(--color-primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={22} color="var(--color-primary)" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Trung tâm Thông báo</h1>
              {unreadNotifCount > 0 && (
                <span className="kw-badge kw-badge-primary">{unreadNotifCount} chưa đọc</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Cập nhật tức thì qua Socket.IO: Bàn giao PIN 6 ký tự, giải ngân Xu, khiếu nại và duyệt bài.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="kw-btn kw-btn-outline kw-btn-sm"
            onClick={() => refreshNotifications()}
          >
            Làm mới
          </button>
          {unreadNotifCount > 0 && (
            <button
              type="button"
              className="kw-btn kw-btn-primary kw-btn-sm"
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={16} />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="kw-tab-bar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12 }}>
        {[
          { id: 'all', label: `Tất cả (${notifications.length})` },
          { id: 'unread', label: `Chưa đọc (${unreadNotifCount})` },
          { id: 'escrow', label: 'Giao dịch & Bàn giao' },
          { id: 'wallet', label: 'Biến động Ví Xu' },
          { id: 'system', label: 'Kiểm duyệt & Hệ thống' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`kw-btn kw-btn-sm ${filter === tab.id ? 'kw-btn-primary' : 'kw-btn-outline'}`}
            onClick={() => setFilter(tab.id as NotifFilter)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredList.length === 0 ? (
        <div className="kw-card" style={{ padding: 40, textAlign: 'center' }}>
          <CheckCircle2 size={42} color="var(--color-secondary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            Không có thông báo nào trong mục này
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Khi có mẹ chọn đổi đồ hoặc hệ thống giải phóng Xu, thông báo sẽ xuất hiện ngay tại đây.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredList.map((n) => {
            const meta = getNotifMeta(n.type);
            return (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className="kw-card"
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  borderLeft: n.isRead ? '1px solid var(--color-border)' : '4px solid var(--color-primary)',
                  background: n.isRead ? 'var(--color-surface)' : 'var(--color-surface-elevated)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: meta.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {meta.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="kw-badge kw-badge-neutral" style={{ fontSize: 11 }}>
                        {meta.tag}
                      </span>
                      {!n.isRead && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                      {formatNotifTime(n.createdAt)}
                    </span>
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {n.body}
                  </div>

                  {(n.relatedTransactionId || n.relatedProductId) && (
                    <div
                      style={{
                        marginTop: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                      }}
                    >
                      <span>
                        {n.relatedTransactionId ? 'Xem chi tiết đơn Ký Quỹ Kép' : 'Xem chi tiết món đồ'}
                      </span>
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
