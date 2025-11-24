import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import en from './locales/en.json';
import uk from './locales/uk.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pl from './locales/pl.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      uk: { translation: uk },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      pl: { translation: pl },
    },
    lng: 'ru',
    fallbackLng: 'ru',
    debug: true, // Включаем отладку
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  }).then(() => {
    // Проверяем что переводы загружены
    console.log('✅ i18n initialized!');
    console.log('Languages:', Object.keys(i18n.store.data));
    console.log('Current language:', i18n.language);
    console.log('Test translation menu.catalog:', i18n.t('menu.catalog'));
    console.log('All menu keys:', Object.keys(ru.menu || {}));
  });

export default i18n;
