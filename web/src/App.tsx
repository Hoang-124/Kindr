// d:\Kindr\web\src\App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { SearchAndMapPage } from './pages/SearchAndMapPage';
import { DonationStationPage } from './pages/DonationStationPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { PostItemPage } from './pages/PostItemPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { ChatPage } from './pages/ChatPage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { NotificationsPage } from './pages/NotificationsPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  const { pathname } = useLocation();
  const isChatRoute = pathname.startsWith('/chat');

  return (
    <div className="kw-app-shell">
      <ScrollToTop />
      <Navbar />
      <main className={`kw-main ${isChatRoute ? 'kw-main-chat' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/search" element={<SearchAndMapPage />} />
          <Route path="/donation-station" element={<DonationStationPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/post" element={<PostItemPage />} />
          <Route path="/edit-post/:id" element={<PostItemPage />} />
          <Route path="/transactions" element={<TransactionDetailPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPortalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isChatRoute && <Footer />}
    </div>
  );
};
export default App;
