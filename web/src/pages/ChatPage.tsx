// d:\Kindr\web\src\pages\ChatPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Send,
  MessageCircle,
  ShieldCheck,
  ExternalLink,
  Search,
  Sparkles,
  ImagePlus,
  Flag,
  KeyRound,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { chatApi, uploadApi, reportApi } from '../services/domainServices';
import { socketService } from '../services/socketService';
import { ChatSession, Message } from '../types';
import { timeAgo } from '../utils/pricing';
import { Avatar, MascotIcon } from '../components/KindrCoin';

const QUICK_REPLIES = [
  'Mình có thể hẹn gặp ở sảnh tòa nhà hoặc quán cafe gần đó nhé!',
  'Món đồ còn sạch đẹp và đầy đủ chi tiết như mô tả ạ.',
  'Khi gặp nhau mẹ nhớ mở mã PIN 6 ký tự trên app để xác nhận trao tay nhé!',
  'Cảm ơn mẹ nhiều nhé, chúc bé chơi vui!',
];

export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { currentUser, chats, transactions, refreshChats, showToast } = useApp();

  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerTyping, setPartnerTyping] = useState<string | null>(null);

  // Report User modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Yêu cầu chuyển khoản ngoài sàn / không qua Double Escrow');
  const [reporting, setReporting] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const lastChatIdRef = useRef<string | undefined>(undefined);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-select first chat on desktop if none selected
  useEffect(() => {
    if (!chatId && chats.length > 0 && window.innerWidth > 860) {
      navigate(`/chat/${chats[0].id}`, { replace: true });
    }
  }, [chatId, chats, navigate]);

  // Load active chat and messages
  useEffect(() => {
    if (!chatId || !currentUser) {
      setActiveChat(null);
      setMessages([]);
      return;
    }

    let mounted = true;
    const found = chats.find((c) => c.id === chatId) || null;
    if (found) setActiveChat(found);

    async function loadRoom() {
      setLoadingMessages(true);
      try {
        const [chatDetail, msgList] = await Promise.all([
          chatApi.getChatById(chatId!).catch(() => found),
          chatApi.getMessages(chatId!),
        ]);
        if (!mounted) return;
        if (chatDetail) setActiveChat(chatDetail);
        setMessages(msgList);
        socketService.joinChat(chatId!);
        socketService.markRead(chatId!);
        refreshChats();
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    }

    loadRoom();

    const handleIncomingMessage = (payload: any) => {
      const incomingChatId = (payload?.chatId || payload?.message?.chatId || '').toString();
      if (incomingChatId !== chatId) return;
      const rawMsg = payload?.message || payload;
      const normalized: Message = {
        id: (rawMsg.id || rawMsg._id || `${Date.now()}`).toString(),
        chatId: incomingChatId,
        senderId: (rawMsg.senderId || '').toString(),
        senderName: rawMsg.senderName || 'Mẹ Bỉm',
        content: rawMsg.content || '',
        timestamp: rawMsg.timestamp || rawMsg.createdAt || new Date().toISOString(),
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === normalized.id)) return prev;
        return [...prev, normalized];
      });
      socketService.markRead(chatId!);
      refreshChats();
    };

    const handleTyping = (data: any) => {
      if (data?.chatId === chatId && data?.userId !== currentUser.id) {
        setPartnerTyping(data?.userName || 'Đối tác');
      }
    };

    const handleStopTyping = (data: any) => {
      if (data?.chatId === chatId) {
        setPartnerTyping(null);
      }
    };

    socketService.on('message_received', handleIncomingMessage);
    socketService.on('user_typing', handleTyping);
    socketService.on('user_stop_typing', handleStopTyping);

    // Fallback sync every 4s & on tab focus so multi-device mobile browsers never miss a message
    const syncMessagesSilently = async () => {
      if (!mounted || document.hidden) return;
      try {
        const latest = await chatApi.getMessages(chatId!);
        if (!mounted) return;
        setMessages((prev) => {
          if (latest.length === prev.length && latest[latest.length - 1]?.id === prev[prev.length - 1]?.id) {
            return prev;
          }
          return latest;
        });
      } catch {
        // Ignore silent sync error
      }
    };

    const syncInterval = setInterval(syncMessagesSilently, 4000);
    window.addEventListener('focus', syncMessagesSilently);

    return () => {
      mounted = false;
      clearInterval(syncInterval);
      window.removeEventListener('focus', syncMessagesSilently);
      socketService.leaveChat(chatId);
      socketService.off('message_received', handleIncomingMessage);
      socketService.off('user_typing', handleTyping);
      socketService.off('user_stop_typing', handleStopTyping);
    };
  }, [chatId, currentUser?.id]);

  // Scroll ONLY the inner messages container (never the outer window/footer!)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const latestMsgId = messages[messages.length - 1]?.id;
    const isChatSwitch = lastChatIdRef.current !== chatId;
    const isNewMessage = latestMsgId !== lastMessageIdRef.current;

    if (isChatSwitch) {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
      if (!loadingMessages) {
        lastChatIdRef.current = chatId;
        lastMessageIdRef.current = latestMsgId;
      }
      return;
    }

    if (isNewMessage) {
      lastMessageIdRef.current = latestMsgId;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
      return;
    }

    if (partnerTyping) {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 160) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [chatId, messages, loadingMessages, partnerTyping]);

  if (!currentUser) {
    return (
      <div className="kw-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="kw-card" style={{ maxWidth: 480, margin: '0 auto', padding: 32 }}>
          <MascotIcon
            size={60}
            dialogue="Đăng nhập để trò chuyện và hẹn điểm giao nhận đồ cùng các mẹ bỉm Đà Nẵng nhé!"
          />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>
            Tin nhắn hẹn gặp trực tiếp
          </h2>
          <button
            className="kw-btn kw-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/login')}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!chatId) return;
    socketService.sendTyping(chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendStopTyping(chatId);
    }, 1500);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const content = (textOverride ?? inputText).trim();
    if (!content || !chatId || sending) return;

    if (!textOverride) setInputText('');
    setSending(true);
    socketService.sendStopTyping(chatId);

    try {
      const sent = await chatApi.sendMessage(chatId, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      refreshChats();
    } catch {
      if (!textOverride) setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const handleUploadChatImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    setUploadingImg(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = await uploadApi.uploadBase64Image(base64, 'kindr/chats');
      await handleSendMessage(`[IMAGE]${url}`);
    } catch {
      showToast({
        title: 'Lỗi gửi ảnh',
        message: 'Không thể tải ảnh lên cuộc trò chuyện.',
        type: 'error',
      });
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const partnerName =
      c.buyerId === currentUser.id ? c.sellerName : c.buyerName;
    return (
      partnerName.toLowerCase().includes(q) ||
      c.productName.toLowerCase().includes(q)
    );
  });

  const partnerId = activeChat
    ? activeChat.buyerId === currentUser.id
      ? activeChat.sellerId
      : activeChat.buyerId
    : '';

  const partnerName = activeChat
    ? activeChat.buyerId === currentUser.id
      ? activeChat.sellerName
      : activeChat.buyerName
    : '';

  const partnerAvatar = activeChat
    ? activeChat.buyerId === currentUser.id
      ? activeChat.sellerAvatar
      : activeChat.buyerAvatar
    : '';

  const relatedTx = activeChat
    ? transactions.find(
        (t) =>
          t.productId === activeChat.productId &&
          (t.buyerId === activeChat.buyerId || t.sellerId === activeChat.sellerId)
      )
    : undefined;

  const handleReportPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !reportReason.trim()) return;
    setReporting(true);
    try {
      await reportApi.submitReport({
        targetType: 'user',
        targetId: partnerId,
        reason: reportReason.trim(),
      });
      setReportModalOpen(false);
      showToast({
        title: 'Đã gửi báo cáo lên Ban Quản Trị',
        message: 'Cảm ơn mẹ đã chung tay giữ gìn cộng đồng Kindr văn minh.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Không thể gửi báo cáo',
        message: err?.response?.data?.error || 'Vui lòng thử lại sau.',
        type: 'error',
      });
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="kw-container kw-chat-page-wrap" style={{ padding: 0 }}>
      <div className={`kw-chat-layout ${chatId ? 'has-active-chat' : ''}`}>
        {/* LEFT SIDEBAR: CHAT LIST */}
        <div className="kw-chat-sidebar">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px' }}>
              Hộp thư Mẹ Bỉm ({chats.length})
            </h2>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="var(--color-text-secondary)"
                style={{ position: 'absolute', left: 12, top: 13 }}
              />
              <input
                type="text"
                className="kw-input"
                style={{ paddingLeft: 36, minHeight: 40, height: 40, fontSize: 13 }}
                placeholder="Tìm theo tên mẹ bỉm hoặc món đồ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filteredChats.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <MessageCircle size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>Chưa có cuộc trò chuyện nào</div>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  Hãy bấm "Nhắn tin" tại trang chi tiết món đồ để bắt đầu hẹn lịch trao tay nhé!
                </p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = c.id === chatId;
                const otherName =
                  c.buyerId === currentUser.id ? c.sellerName : c.buyerName;
                const otherAvatar =
                  c.buyerId === currentUser.id ? c.sellerAvatar : c.buyerAvatar;
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/chat/${c.id}`)}
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-divider)',
                      backgroundColor: isSelected
                        ? 'var(--color-primary-light)'
                        : 'transparent',
                    }}
                  >
                    <Avatar uri={otherAvatar} name={otherName} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{otherName}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          {timeAgo(c.lastMessageTime)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--color-primary-dark)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {c.productName}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 2,
                        }}
                      >
                        {c.lastMessageText?.startsWith('[IMAGE]')
                          ? '[Hình ảnh đính kèm]'
                          : c.lastMessageText || 'Bắt đầu cuộc trò chuyện...'}
                      </div>
                    </div>
                    {c.unreadCount > 0 && !isSelected && (
                      <span
                        style={{
                          minWidth: 20,
                          height: 20,
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-text-white)',
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 6px',
                        }}
                      >
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: MESSAGE THREAD */}
        <div className="kw-chat-thread">
          {!activeChat ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
                textAlign: 'center',
              }}
            >
              <MascotIcon
                size={64}
                dialogue="Chọn một cuộc trò chuyện để hẹn giờ và địa điểm trao tay đồ cho bé nhé!"
              />
            </div>
          ) : (
            <>
              {/* Compact Chat Header + Product Ribbon */}
              <div
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderBottom: '1px solid var(--color-border)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      className="kw-btn kw-btn-ghost kw-btn-sm kw-chat-mobile-back"
                      onClick={() => navigate('/chat')}
                      style={{ minHeight: 36, width: 36, padding: 0, flexShrink: 0 }}
                      title="Quay lại danh sách tin nhắn"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <Avatar uri={partnerAvatar} name={partnerName} size={38} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {partnerName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReportModalOpen(true)}
                          className="kw-btn kw-btn-ghost kw-btn-sm"
                          style={{ minHeight: 24, padding: '0 6px', fontSize: 11, color: 'var(--color-text-secondary)', flexShrink: 0 }}
                          title="Báo cáo người dùng"
                        >
                          <Flag size={11} />
                        </button>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: 'var(--color-secondary-dark)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <ShieldCheck size={12} style={{ flexShrink: 0 }} />
                        <span>Bảo vệ bởi Double Escrow</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {relatedTx ? (
                      <button
                        type="button"
                        className="kw-btn kw-btn-primary kw-btn-sm"
                        style={{ minHeight: 34, padding: '0 10px', fontSize: 12 }}
                        onClick={() => navigate(`/transactions/${relatedTx.id}`)}
                      >
                        <KeyRound size={13} />
                        <span>
                          {relatedTx.status === 'awaiting_handover'
                            ? `PIN${relatedTx.handoverCode ? `: ${relatedTx.handoverCode}` : ''}`
                            : 'Đơn Ký Quỹ'}
                        </span>
                      </button>
                    ) : (
                      activeChat.productId && (
                        <button
                          type="button"
                          className="kw-btn kw-btn-primary kw-btn-sm"
                          style={{ minHeight: 34, padding: '0 10px', fontSize: 12 }}
                          onClick={() => navigate(`/products/${activeChat.productId}`)}
                        >
                          <ShieldCheck size={13} />
                          <span>Đổi ngay</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Sleek Product Context Sub-bar */}
                <div
                  onClick={() => activeChat.productId && navigate(`/products/${activeChat.productId}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderTop: '1px solid var(--color-divider)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    cursor: activeChat.productId ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {activeChat.productImage && (
                      <img
                        src={activeChat.productImage}
                        alt={activeChat.productName}
                        style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Món đồ: {activeChat.productName}
                    </span>
                  </div>
                  {activeChat.productId && (
                    <ExternalLink size={13} color="var(--color-text-secondary)" style={{ flexShrink: 0 }} />
                  )}
                </div>
              </div>

              {/* Messages Container */}
              <div
                ref={messagesContainerRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 24 }}>
                    Đang tải tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 24, fontSize: 13 }}>
                    Hãy gửi lời chào đầu tiên để hẹn thời gian và địa điểm giao nhận món đồ nhé!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSystem = msg.senderId === 'system';
                    const isMine = msg.senderId === currentUser.id;
                    const isImageMsg = msg.content.startsWith('[IMAGE]');
                    const imageUrl = isImageMsg ? msg.content.replace('[IMAGE]', '').trim() : '';

                    if (isSystem) {
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: 'center',
                            maxWidth: '92%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-default)',
                            backgroundColor: 'var(--color-warning-bg)',
                            border: '1px solid var(--color-warning)',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            textAlign: 'center',
                          }}
                        >
                          {msg.content}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            padding: isImageMsg ? 6 : '9px 14px',
                            borderRadius: 16,
                            backgroundColor: isMine
                              ? 'var(--color-primary)'
                              : 'var(--color-card)',
                            color: isMine
                              ? 'var(--color-text-white)'
                              : 'var(--color-text)',
                            border: isMine ? 'none' : '1px solid var(--color-border)',
                            fontSize: 14,
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                            boxShadow: 'var(--shadow-soft)',
                          }}
                        >
                          {isImageMsg ? (
                            <img
                              src={imageUrl}
                              alt="Hình đính kèm"
                              style={{
                                maxWidth: 'min(240px, 68vw)',
                                maxHeight: 220,
                                borderRadius: 12,
                                display: 'block',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--color-text-secondary)',
                            marginTop: 3,
                            padding: '0 4px',
                          }}
                        >
                          {timeAgo(msg.timestamp)}
                        </span>
                      </div>
                    );
                  })
                )}

                {partnerTyping && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    {partnerTyping} đang soạn tin nhắn...
                  </div>
                )}
              </div>

              {/* Quick Replies Bar */}
              <div
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--color-card)',
                  borderTop: '1px solid var(--color-divider)',
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  flexShrink: 0,
                }}
              >
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleSendMessage(reply)}
                    className="kw-btn kw-btn-ghost kw-btn-sm"
                    style={{
                      minHeight: 28,
                      padding: '0 10px',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={11} color="var(--color-primary)" />
                    <span>{reply}</span>
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-card)',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <label
                  className="kw-btn kw-btn-outline kw-btn-sm"
                  style={{
                    cursor: uploadingImg ? 'wait' : 'pointer',
                    width: 40,
                    height: 40,
                    minHeight: 40,
                    padding: 0,
                    flexShrink: 0,
                    borderRadius: 'var(--radius-full)',
                  }}
                  title="Gửi hình ảnh thực tế món đồ / điểm hẹn"
                >
                  <ImagePlus size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadChatImage}
                    style={{ display: 'none' }}
                    disabled={uploadingImg}
                  />
                </label>

                <input
                  type="text"
                  className="kw-input"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 40,
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 14,
                  }}
                  placeholder={
                    uploadingImg
                      ? 'Đang tải ảnh...'
                      : 'Nhập tin nhắn hẹn gặp...'
                  }
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                />
                <button
                  type="submit"
                  className="kw-btn kw-btn-primary kw-btn-sm"
                  style={{
                    minHeight: 40,
                    height: 40,
                    padding: '0 14px',
                    flexShrink: 0,
                    borderRadius: 'var(--radius-full)',
                  }}
                  disabled={!inputText.trim() || sending}
                >
                  <Send size={16} />
                  <span>Gửi</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Report Partner Modal */}
      {reportModalOpen && (
        <div
          className="kw-modal-backdrop"
          onClick={() => setReportModalOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="kw-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Báo cáo vi phạm ({partnerName})</h3>
              <button
                type="button"
                className="kw-btn kw-btn-ghost kw-btn-sm"
                onClick={() => setReportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReportPartner}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {[
                  'Yêu cầu chuyển khoản ngoài sàn / không qua Double Escrow',
                  'Ngôn từ thiếu văn minh hoặc cố tình mặc cả ép giá',
                  'Bùng hẹn giao nhận đồ nhiều lần không báo trước',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReportReason(preset)}
                    className="kw-btn kw-btn-ghost kw-btn-sm"
                    style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: 12 }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                className="kw-textarea"
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Mô tả chi tiết hành vi vi phạm..."
                style={{ marginBottom: 14 }}
                required
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="kw-btn kw-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setReportModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="kw-btn kw-btn-danger"
                  style={{ flex: 1.5 }}
                  disabled={reporting}
                >
                  {reporting ? 'Đang gửi...' : 'Gửi báo cáo lên BQT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

