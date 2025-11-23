import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from './store';

// Pages
import WelcomePage from './pages/WelcomePage';
import AgreementPage from './pages/AgreementPage';
import CountryPage from './pages/CountryPage';
import CityPage from './pages/CityPage';
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
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import GoodbyePage from './pages/GoodbyePage';

function App() {
  const { i18n } = useTranslation();
  const { isRegistered, language } = useStore();

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }

    // Установка языка
    i18n.changeLanguage(language);
  }, [language, i18n]);

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
            <Route path="/country" element={<CountryPage />} />
            <Route path="/city" element={<CityPage />} />
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
            <Route path="/chat/:chatId" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
