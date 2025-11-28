import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from './store';
import { getTelegramId } from './utils/telegram';
import { ErrorBoundary } from './components/ErrorBoundary';

// КРИТИЧНО: Проверка версии ДО импорта store и загрузки компонентов
const REQUIRED_VERSION = 3;
const checkStorageVersion = () => {
  try {
    const storageData = localStorage.getItem('kupyprodai-storage');
    
    if (!storageData) {
      console.log('✅ Нет сохраненных данных, продолжаем');
      return true;
    }
    
    const parsed = JSON.parse(storageData);
    // Zustand persist хранит версию в корне: {state: {...}, version: N}
    const currentVersion = parsed.version || 0;
    
    console.log(`🔍 Проверка версии: текущая=${currentVersion}, требуется=${REQUIRED_VERSION}`);
    
    if (currentVersion < REQUIRED_VERSION) {
      console.log(`🔄 Версия устарела! Очищаем localStorage и перезагружаем...`);
      localStorage.clear();
      sessionStorage.clear();
      
      // КРИТИЧНО: Устанавливаем флаг чтобы отключить автологин после перезагрузки
      sessionStorage.setItem('skip-autologin', 'true');
      
      // Принудительная перезагрузка с очисткой кэша
      window.location.href = window.location.href + '?v=' + Date.now();
      return false;
    }
    
    console.log('✅ Версия актуальна');
    return true;
  } catch (e) {
    console.error('❌ Ошибка проверки версии:', e);
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('skip-autologin', 'true');
    window.location.href = window.location.href + '?v=' + Date.now();
    return false;
  }
};

// Выполняем проверку сразу при импорте модуля (ДО загрузки Zustand!)
if (typeof window !== 'undefined') {
  checkStorageVersion();
}

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
import DevAdminPage from './pages/DevAdminPage';

function App() {
  const { i18n } = useTranslation();
  const { isRegistered, language, user } = useStore();
  const [isBanned, setIsBanned] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // Флаг проверки аутентификации

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
      try {
        const telegramId = getTelegramId();
        
        // 🔒 КРИТИЧНО: Если НЕТ Telegram ID - выходим из приложения
        if (!telegramId) {
          console.error('🚫 БЛОКИРОВКА: Telegram ID отсутствует!');
          if (isRegistered) {
            console.log('❌ Пользователь считается зарегистрированным, но нет Telegram ID - выход!');
            useStore.getState().logout();
          }
          setAuthChecked(true);
          return;
        }
        
        // КРИТИЧНО: Если пользователь считается зарегистрированным - ОБЯЗАТЕЛЬНО проверяем его в базе
        if (isRegistered) {
          console.log('🔍 ОБЯЗАТЕЛЬНАЯ проверка существования пользователя в базе:', telegramId);
          
          try {
            const { userAPI } = await import('./services/api');
            const response = await userAPI.getUserByTelegramId(telegramId);
            
            if (!response.data) {
              console.log('❌ Пользователь не найден в базе - ВЫХОД И РЕГИСТРАЦИЯ');
              // Очищаем localStorage и сбрасываем состояние
              useStore.getState().logout();
              setAuthChecked(true);
              return;
            }
            
            console.log('✅ Пользователь найден в базе:', response.data.nickname);
            
            // Проверяем бан
            if (response.data.banned) {
              console.log('🚫 Пользователь забанен');
              setIsBanned(true);
            }
            
            setAuthChecked(true);
          } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403) {
              console.log('❌ Пользователь не найден в базе - ВЫХОД И РЕГИСТРАЦИЯ');
              // Очищаем localStorage и сбрасываем состояние
              useStore.getState().logout();
            } else {
              console.error('❌ Ошибка проверки пользователя:', error);
              // При ошибке сервера также выходим для безопасности
              useStore.getState().logout();
            }
            setAuthChecked(true);
          }
        } else {
          setAuthChecked(true);
        }
        
        // Автологин для незарегистрированных
        if (!isRegistered) {
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
      } catch (authError: any) {
        if (authError.message === 'NOT_AUTHENTICATED') {
          console.log('ℹ️ Пользователь не авторизован через Telegram');
        } else {
          console.error('❌ Ошибка автовхода:', authError);
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

  // Ожидание инициализации i18n и проверки аутентификации
  if (!i18nReady || !authChecked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        fontWeight: '600',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div>🐻 Загрузка...</div>
        {isRegistered && !authChecked && (
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            🔒 ОБЯЗАТЕЛЬНАЯ проверка регистрации в базе...
          </div>
        )}
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

  // 🔒 КРИТИЧНО: Если считается зарегистрированным, но проверка не прошла - НЕ ПУСКАЕМ
  if (isRegistered && authChecked && !user) {
    console.error('🚫 БЛОКИРОВКА: Пользователь не найден в базе данных!');
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/agreement" element={<AgreementPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/radius" element={<RadiusPage />} />
          <Route path="/nickname" element={<NicknamePage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Секретная страница для включения режима админа */}
          <Route path="/dev-admin" element={<DevAdminPage />} />
        
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
    </ErrorBoundary>
  );
}

export default App;
