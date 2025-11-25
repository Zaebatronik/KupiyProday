import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from './store';
import { getTelegramId } from './utils/telegram';

// Pages
import WelcomePage from './pages/WelcomePage';
import AgreementPage from './pages/AgreementPage';
import LocationPage from './pages/LocationPage';
import RadiusPage from './pages/RadiusPage';
import NicknamePage from './pages/NicknamePage';
import MainMenu from './pages/MainMenu';
import CatalogPage from './pages/CatalogPage';
import ListingDetailPage from './pages/ListingDetailPage';
import AddListingPage from './pages/AddListingPage';
import MyListingsPage from './pages/MyListingsPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import SupportPage from './pages/SupportPage';
import SimpleChatPage from './pages/SimpleChatPage';
import ChatsListPage from './pages/ChatsListPage';
import AdminPage from './pages/AdminPage';
import AdminUserProfile from './pages/AdminUserProfile';
import UserProfilePage from './pages/UserProfilePage';
import GoodbyePage from './pages/GoodbyePage';
import BannedPage from './pages/BannedPage';

function App() {
  const { i18n } = useTranslation();
  const { isRegistered, language, user } = useStore();
  const [isBanned, setIsBanned] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }

    // Установка языка и ожидание инициализации
    const initLanguage = async () => {
      await i18n.changeLanguage(language);
      setI18nReady(true);
    };
    initLanguage();

    // Автоматический вход по Telegram ID
    const autoLogin = async () => {
      const telegramId = getTelegramId();
      
      if (telegramId && !isRegistered) {
        console.log('🔑 Проверка регистрации по Telegram ID:', telegramId);
        
        try {
          const { userAPI } = await import('./services/api');
          const response = await userAPI.getProfile(telegramId);
          const existingUser = response.data;
          
          console.log('✅ Пользователь найден:', existingUser.nickname);
          
          // Проверяем бан
          if (existingUser.banned) {
            console.log('🚫 Пользователь забанен');
            const { setUser } = useStore.getState();
            setUser(existingUser);
            setIsBanned(true);
            return;
          }
          
          // Автоматический вход
          const { setUser, addUserToRegistry } = useStore.getState();
          setUser(existingUser);
          addUserToRegistry(existingUser);
          localStorage.setItem('currentUser', JSON.stringify(existingUser));
          
          console.log('✅ Автоматический вход выполнен');
        } catch (error) {
          console.log('ℹ️ Пользователь не найден, нужна регистрация');
        }
      }
    };
    autoLogin();

    // Проверка и отправка отложенных регистраций
    const processPendingRegistration = async () => {
      const pending = localStorage.getItem('pendingRegistration');
      if (pending) {
        try {
          const { userData, timestamp } = JSON.parse(pending);
          const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
          
          // Если прошло больше 24 часов, очищаем
          if (hoursSince > 24) {
            console.log('🗑️ Очередь регистрации устарела (>24ч), удаляем');
            localStorage.removeItem('pendingRegistration');
            return;
          }
          
          console.log('📤 Найдена отложенная регистрация, отправляем на сервер...');
          const { userAPI } = await import('./services/api');
          const response = await userAPI.register(userData);
          console.log('✅ Отложенная регистрация выполнена:', response.data);
          localStorage.removeItem('pendingRegistration');
        } catch (error) {
          console.log('⚠️ Не удалось отправить отложенную регистрацию, попробуем позже');
        }
      }
    };

    processPendingRegistration();
  }, [language, i18n]);

  // Проверка бана при загрузке приложения
  useEffect(() => {
    const checkBanStatus = async () => {
      if (isRegistered && user?.id) {
        try {
          const { userAPI } = await import('./services/api');
          const response = await userAPI.getProfile(user.id);
          if (response.data.banned) {
            setIsBanned(true);
          }
        } catch (error) {
          console.error('Failed to check ban status:', error);
        }
      }
    };

    checkBanStatus();
    
    // Проверяем бан каждые 5 секунд
    const interval = setInterval(checkBanStatus, 5000);
    return () => clearInterval(interval);
  }, [isRegistered, user]);

  // Ожидание инициализации i18n
  if (!i18nReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        🐻 Загрузка...
      </div>
    );
  }

  // Если пользователь забанен - показываем только страницу бана
  if (isBanned) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<BannedPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Страница прощания (доступна всегда) */}
        <Route path="/goodbye" element={<GoodbyePage />} />
        
        {/* Регистрация */}
        {!isRegistered ? (
          <>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/agreement" element={<AgreementPage />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/radius" element={<RadiusPage />} />
            <Route path="/nickname" element={<NicknamePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            {/* Основное приложение */}
            <Route path="/" element={<MainMenu />} />
            <Route path="/menu" element={<MainMenu />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route path="/add" element={<AddListingPage />} />
            <Route path="/add-listing" element={<AddListingPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/chats" element={<ChatsListPage />} />
            <Route path="/chat/:listingId" element={<SimpleChatPage />} />
            <Route path="/direct-chat/:chatId" element={<SimpleChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/user/:userId" element={<AdminUserProfile />} />
            <Route path="/user/:userId" element={<UserProfilePage />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
