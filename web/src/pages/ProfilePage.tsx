// d:\Kindr\web\src\pages\ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Package,
  Star,
  Settings,
  Edit3,
  Trash2,
  Camera,
  ShieldAlert,
  CheckCircle2,
  Lock,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  authApi,
  productApi,
  ratingApi,
  uploadApi,
} from '../services/domainServices';
import { Product, RatingItem } from '../types';
import { DANANG_DISTRICTS, getDistrictById } from '../utils/locations';
import { formatFullDate } from '../utils/pricing';
import { Avatar, KindrCoin, MascotIcon } from '../components/KindrCoin';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    setCurrentUser,
    refreshProducts,
    refreshUser,
    logout,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'civilization' | 'edit' | 'security'>('posts');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myRatings, setMyRatings] = useState<RatingItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Edit profile form
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [districtId, setDistrictId] = useState(
    currentUser?.location?.districtId || 'dn_haichau'
  );
  const [addressDetail, setAddressDetail] = useState(
    currentUser?.location?.addressDetail || ''
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Security form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadMyData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const [prods, ratingRes] = await Promise.all([
        productApi.getMyProducts(),
        ratingApi.getUserRatings(currentUser.id).catch(() => ({
          ratings: [],
          averageStars: 5,
          totalRatings: 0,
        })),
      ]);
      setMyProducts(prods);
      setMyRatings(ratingRes.ratings);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setDistrictId(currentUser.location?.districtId || 'dn_haichau');
      setAddressDetail(currentUser.location?.addressDetail || '');
      loadMyData();
    }
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="kw-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="kw-card" style={{ maxWidth: 480, margin: '0 auto', padding: 32 }}>
          <MascotIcon
            size={60}
            dialogue="Đăng nhập để xem Thước đo Điểm Văn Minh và quản lý tủ đồ của mẹ nhé!"
          />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>Hồ sơ Cá nhân</h2>
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = await uploadApi.uploadBase64Image(base64, 'kindr/avatars');
      const updated = await authApi.updateProfile({ avatar: url });
      setCurrentUser(updated);
      showToast({
        title: 'Đã cập nhật ảnh đại diện!',
        message: 'Ảnh đại diện mới của mẹ đã được lưu.',
        type: 'success',
      });
    } catch {
      setErrorMsg('Không thể tải ảnh đại diện lên.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavingProfile(true);
    try {
      const d = getDistrictById(districtId);
      const updated = await authApi.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        location: {
          districtId: d.id,
          districtName: d.name,
          addressDetail: addressDetail.trim(),
        },
      });
      setCurrentUser(updated);
      showToast({
        title: 'Đã lưu hồ sơ!',
        message: 'Thông tin cá nhân và khu vực giao nhận đã được cập nhật.',
        type: 'success',
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Không thể lưu hồ sơ.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    setErrorMsg('');
    try {
      const res = await productApi.deleteProduct(prod.id);
      setMyProducts((prev) => prev.filter((p) => p.id !== prod.id));
      await Promise.all([refreshProducts(), refreshUser()]);
      showToast({
        title: 'Đã gỡ bài đăng',
        message: res.message || 'Đã hoàn lại cọc Safe Fee về ví của mẹ.',
        type: 'info',
      });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error || 'Không thể xóa bài đăng đang trong quá trình giao dịch.'
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    setChangingPass(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      showToast({
        title: 'Đổi mật khẩu thành công!',
        message: 'Mật khẩu bảo mật của bạn đã được cập nhật.',
        type: 'success',
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Mật khẩu hiện tại không đúng.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'XOA TAI KHOAN') {
      setErrorMsg('Vui lòng nhập đúng chữ "XOA TAI KHOAN" để xác nhận.');
      return;
    }
    setErrorMsg('');
    try {
      await authApi.deleteAccount();
      setCurrentUser(null);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error ||
          'Không thể xóa tài khoản khi còn giao dịch Double Escrow đang diễn ra.'
      );
    }
  };

  const civPoints = Math.min(100, Math.max(0, currentUser.civilizationPoints ?? 95));
  const civTier =
    civPoints >= 95
      ? 'Đại Sứ Văn Minh Đà Nẵng'
      : civPoints >= 80
      ? 'Mẹ Bỉm Uy Tín'
      : 'Cần Cải Thiện Uy Tín';

  return (
    <div className="kw-container" style={{ padding: '28px 16px 64px' }}>
      {/* TOP IDENTITY & CIVILIZATION BANNER */}
      <div
        className="kw-card"
        style={{
          padding: 28,
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Avatar uri={currentUser.avatar} name={currentUser.name} size={84} />
            <label
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid var(--color-card)',
              }}
              title="Đổi ảnh đại diện"
            >
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                disabled={uploadingAvatar}
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{currentUser.name}</h1>
              <span className="kw-badge kw-badge-secondary">{civTier}</span>
              {currentUser.role === 'admin' && (
                <span className="kw-badge kw-badge-primary">Quản trị viên</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 10px' }}>
              {currentUser.bio || 'Thành viên cộng đồng trao đổi đồ mẹ và bé văn minh Kindr Đà Nẵng'}
            </p>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 700 }}>
              <span>★ {currentUser.reputationScore.toFixed(1)} Uy tín</span>
              <span>•</span>
              <span>{currentUser.tradesCount} lần đổi đồ</span>
              <span>•</span>
              <span style={{ color: 'var(--color-primary-dark)' }}>
                <KindrCoin size={15} /> {currentUser.xuBalance} Xu
              </span>
            </div>
          </div>
        </div>

        {/* Civilization Gauge */}
        <div
          style={{
            padding: 18,
            borderRadius: 'var(--radius-default)',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
              <Award size={18} color="var(--color-secondary-dark)" />
              <span>Thước đo Điểm Văn Minh</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-secondary-dark)' }}>
              {civPoints}/100
            </span>
          </div>

          <div
            style={{
              height: 10,
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-border)',
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: `${civPoints}%`,
                height: '100%',
                backgroundColor:
                  civPoints >= 80 ? 'var(--color-secondary)' : 'var(--color-warning)',
              }}
            />
          </div>

          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            +1 điểm mỗi giao dịch hoàn tất • +2 điểm khi nhận đánh giá 4–5 sao • -25 điểm nếu gian lận mô tả
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="kw-tab-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={activeTab === 'posts' ? 'kw-btn kw-btn-primary' : 'kw-btn kw-btn-outline'}
        >
          <Package size={16} />
          <span>Tủ đồ đã đăng ({myProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('civilization')}
          className={
            activeTab === 'civilization' ? 'kw-btn kw-btn-primary' : 'kw-btn kw-btn-outline'
          }
        >
          <Star size={16} />
          <span>Lịch sử Điểm Văn Minh & Đánh giá ({myRatings.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={activeTab === 'edit' ? 'kw-btn kw-btn-primary' : 'kw-btn kw-btn-outline'}
        >
          <Edit3 size={16} />
          <span>Chỉnh sửa Hồ sơ</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={activeTab === 'security' ? 'kw-btn kw-btn-primary' : 'kw-btn kw-btn-outline'}
        >
          <Settings size={16} />
          <span>Bảo mật & Tài khoản</span>
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-default)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* TAB 1: MY POSTS */}
      {activeTab === 'posts' && (
        <div className="kw-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Danh sách món đồ của mẹ ({myProducts.length})
            </h3>
            <button
              type="button"
              className="kw-btn kw-btn-primary kw-btn-sm"
              onClick={() => navigate('/post')}
            >
              <PlusCircle size={15} />
              <span>Đăng thêm món đồ</span>
            </button>
          </div>

          {loadingData ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Đang tải tủ đồ...
            </div>
          ) : myProducts.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Mẹ chưa đăng món đồ nào. Hãy đăng món đồ đầu tiên để mở khóa toàn bộ 10 Xu Chào Mừng nhé!
            </div>
          ) : (
            <div className="kw-table-wrap">
              <table className="kw-table">
                <thead>
                  <tr>
                    <th>Món đồ</th>
                    <th>Mức Xu</th>
                    <th>Cọc Safe Fee</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {myProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                          />
                          <div>
                            <div
                              style={{ fontWeight: 800, cursor: 'pointer' }}
                              onClick={() => navigate(`/products/${p.id}`)}
                            >
                              {p.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                              {p.conditionLabel || `Mới ${p.condition}%`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{p.price === 0 ? 'Tặng 0 Xu' : `${p.price} Xu`}</strong>
                      </td>
                      <td>{p.safeFeeLocked} Xu</td>
                      <td>
                        <span className="kw-badge kw-badge-secondary">{p.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(p.status === 'available' || p.status === 'pending_approval') && (
                            <>
                              <button
                                type="button"
                                className="kw-btn kw-btn-outline kw-btn-sm"
                                onClick={() => navigate(`/edit-post/${p.id}`)}
                              >
                                <Edit3 size={14} /> Sửa
                              </button>
                              <button
                                type="button"
                                className="kw-btn kw-btn-ghost kw-btn-sm"
                                style={{ color: 'var(--color-error)' }}
                                onClick={() => handleDeleteProduct(p)}
                              >
                                <Trash2 size={14} /> Gỡ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CIVILIZATION LOGS & RATINGS */}
      {activeTab === 'civilization' && (
        <div className="kw-grid-2">
          <div className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px' }}>
              Nhật ký biến động Điểm Văn Minh
            </h3>
            {!currentUser.historyPoints || currentUser.historyPoints.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Điểm khởi đầu mặc định: <strong>95/100 Điểm Văn Minh</strong>. Hoàn tất giao dịch để tích lũy thêm điểm!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentUser.historyPoints.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{log.reason}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {formatFullDate(log.date)}
                      </div>
                    </div>
                    <strong
                      style={{
                        color:
                          log.pointsChanged >= 0
                            ? 'var(--color-success)'
                            : 'var(--color-error)',
                      }}
                    >
                      {log.pointsChanged >= 0 ? `+${log.pointsChanged}` : log.pointsChanged} điểm
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px' }}>
              Nhận xét từ các Mẹ Bỉm khác ({myRatings.length})
            </h3>
            {myRatings.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Chưa có nhận xét nào.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myRatings.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{r.fromUserName}</strong>
                      <span style={{ color: 'var(--color-coin-text)', fontWeight: 800 }}>
                        {'★'.repeat(r.stars)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, margin: '4px 0' }}>{r.comment}</p>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {formatFullDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EDIT PROFILE */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile} className="kw-card" style={{ padding: 24, maxWidth: 640 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
            Cập nhật thông tin cá nhân & Khu vực Đà Nẵng
          </h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Họ và tên hiển thị
            </label>
            <input
              type="text"
              className="kw-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Giới thiệu ngắn
            </label>
            <textarea
              className="kw-textarea"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="VD: Mẹ bé Bơ 2 tuổi tại KĐT FPT City, ưu tiên đồ chơi gỗ & sách Ehon..."
            />
          </div>

          <div className="kw-grid-2" style={{ marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Quận thường trú
              </label>
              <select
                className="kw-select"
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
              >
                {DANANG_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Khu dân cư / Tòa nhà
              </label>
              <input
                type="text"
                className="kw-input"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="VD: Tòa FPT Plaza 2"
              />
            </div>
          </div>

          <button type="submit" className="kw-btn kw-btn-primary" disabled={savingProfile}>
            <CheckCircle2 size={17} />
            <span>{savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </form>
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === 'security' && (
        <div className="kw-grid-2">
          <form onSubmit={handleChangePassword} className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px' }}>
              <Lock size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Đổi mật khẩu đăng nhập
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                className="kw-input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Mật khẩu mới (Tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                className="kw-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="kw-btn kw-btn-primary" disabled={changingPass}>
              Cập nhật mật khẩu
            </button>
          </form>

          <div className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 12px', color: 'var(--color-error)' }}>
              <ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Đăng xuất & Xóa tài khoản an toàn
            </h3>

            <button
              type="button"
              className="kw-btn kw-btn-outline"
              style={{ width: '100%', marginBottom: 20 }}
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất khỏi thiết bị này</span>
            </button>

            <div
              style={{
                paddingTop: 16,
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                Để xóa vĩnh viễn tài khoản (chỉ thực hiện được khi không còn giao dịch Escrow đang mở), nhập <strong>XOA TAI KHOAN</strong> bên dưới:
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="kw-input"
                  placeholder="XOA TAI KHOAN"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                />
                <button
                  type="button"
                  className="kw-btn kw-btn-outline"
                  style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                  onClick={handleDeleteAccount}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
