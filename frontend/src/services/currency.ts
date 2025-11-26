// Умный сервис курсов валют с онлайн обновлением
import axios from 'axios';

// Маппинг стран на валюты (коды стран, русские и английские названия)
const COUNTRY_CURRENCIES: Record<string, string> = {
  // Коды стран ISO 3166-1 alpha-2 (ОСНОВНОЙ ФОРМАТ В БД)
  'UA': 'UAH',
  'RU': 'RUB',
  'BY': 'BYN',
  'KZ': 'KZT',
  'DE': 'EUR',
  'FR': 'EUR',
  'ES': 'EUR',
  'IT': 'EUR',
  'PL': 'PLN',
  'CZ': 'CZK',
  'GB': 'GBP',
  'US': 'USD',
  'CA': 'CAD',
  'AU': 'AUD',
  'TR': 'TRY',
  'GE': 'GEL',
  'AM': 'AMD',
  'AZ': 'AZN',
  'UZ': 'UZS',
  'MD': 'MDL',
  'LV': 'EUR',
  'LT': 'EUR',
  'EE': 'EUR',
  'BG': 'BGN',
  'RO': 'RON',
  'RS': 'RSD',
  'HR': 'EUR',
  'HU': 'HUF',
  'SK': 'EUR',
  'SI': 'EUR',
  'GR': 'EUR',
  'PT': 'EUR',
  'AT': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  'FI': 'EUR',
  'CH': 'CHF',
  'JP': 'JPY',
  'CN': 'CNY',
  'KR': 'KRW',
  'IN': 'INR',
  'BR': 'BRL',
  'MX': 'MXN',
  'AR': 'ARS',
  
  // Русские названия (для обратной совместимости)
  'Украина': 'UAH',
  'Россия': 'RUB',
  'Беларусь': 'BYN',
  'Казахстан': 'KZT',
  'Германия': 'EUR',
  'Франция': 'EUR',
  'Испания': 'EUR',
  'Италия': 'EUR',
  'Польша': 'PLN',
  'Чехия': 'CZK',
  'Великобритания': 'GBP',
  'США': 'USD',
  'Канада': 'CAD',
  'Австралия': 'AUD',
  'Турция': 'TRY',
  'Грузия': 'GEL',
  'Армения': 'AMD',
  'Азербайджан': 'AZN',
  'Узбекистан': 'UZS',
  'Молдова': 'MDL',
  'Латвия': 'EUR',
  'Литва': 'EUR',
  'Эстония': 'EUR',
  'Болгария': 'BGN',
  'Румыния': 'RON',
  'Сербия': 'RSD',
  'Хорватия': 'EUR',
  'Венгрия': 'HUF',
  'Словакия': 'EUR',
  'Словения': 'EUR',
  'Греция': 'EUR',
  'Португалия': 'EUR',
  'Австрия': 'EUR',
  'Нидерланды': 'EUR',
  'Бельгия': 'EUR',
  'Швеция': 'SEK',
  'Норвегия': 'NOK',
  'Дания': 'DKK',
  'Финляндия': 'EUR',
  'Швейцария': 'CHF',
  'Япония': 'JPY',
  'Китай': 'CNY',
  'Южная Корея': 'KRW',
  'Индия': 'INR',
  'Бразилия': 'BRL',
  'Мексика': 'MXN',
  'Аргентина': 'ARS',
  
  // Английские названия (для обратной совместимости)
  'Ukraine': 'UAH',
  'Russia': 'RUB',
  'Belarus': 'BYN',
  'Kazakhstan': 'KZT',
  'Germany': 'EUR',
  'France': 'EUR',
  'Spain': 'EUR',
  'Italy': 'EUR',
  'Poland': 'PLN',
  'Czech Republic': 'CZK',
  'United Kingdom': 'GBP',
  'USA': 'USD',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'Turkey': 'TRY',
  'Georgia': 'GEL',
  'Armenia': 'AMD',
  'Azerbaijan': 'AZN',
  'Uzbekistan': 'UZS',
  'Moldova': 'MDL',
  'Latvia': 'EUR',
  'Lithuania': 'EUR',
  'Estonia': 'EUR',
  'Bulgaria': 'BGN',
  'Romania': 'RON',
  'Serbia': 'RSD',
  'Croatia': 'EUR',
  'Hungary': 'HUF',
  'Slovakia': 'EUR',
  'Slovenia': 'EUR',
  'Greece': 'EUR',
  'Portugal': 'EUR',
  'Austria': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Denmark': 'DKK',
  'Finland': 'EUR',
  'Switzerland': 'CHF',
  'Japan': 'JPY',
  'China': 'CNY',
  'South Korea': 'KRW',
  'India': 'INR',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'Argentina': 'ARS',
};

// Символы валют
const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'UAH': '₴',
  'RUB': '₽',
  'BYN': 'Br',
  'KZT': '₸',
  'PLN': 'zł',
  'CZK': 'Kč',
  'GBP': '£',
  'CAD': 'C$',
  'AUD': 'A$',
  'TRY': '₺',
  'GEL': '₾',
  'AMD': '֏',
  'AZN': '₼',
  'UZS': 'сўм',
  'MDL': 'L',
  'BGN': 'лв',
  'RON': 'lei',
  'RSD': 'дин',
  'HUF': 'Ft',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'CHF': 'CHF',
  'JPY': '¥',
  'CNY': '¥',
  'KRW': '₩',
  'INR': '₹',
  'BRL': 'R$',
  'MXN': 'Mex$',
  'ARS': 'ARS$',
};

// Названия валют
const CURRENCY_NAMES: Record<string, string> = {
  'USD': 'доллар США',
  'EUR': 'евро',
  'UAH': 'гривна',
  'RUB': 'рубль',
  'BYN': 'белорусский рубль',
  'KZT': 'тенге',
  'PLN': 'злотый',
  'CZK': 'чешская крона',
  'GBP': 'фунт стерлингов',
  'CAD': 'канадский доллар',
  'AUD': 'австралийский доллар',
  'TRY': 'турецкая лира',
  'GEL': 'лари',
  'AMD': 'драм',
  'AZN': 'азербайджанский манат',
  'UZS': 'сум',
  'MDL': 'молдавский лей',
  'BGN': 'болгарский лев',
  'RON': 'румынский лей',
  'RSD': 'сербский динар',
  'HUF': 'венгерский форинт',
  'SEK': 'шведская крона',
  'NOK': 'норвежская крона',
  'DKK': 'датская крона',
  'CHF': 'швейцарский франк',
  'JPY': 'иена',
  'CNY': 'юань',
  'KRW': 'вона',
  'INR': 'рупия',
  'BRL': 'бразильский реал',
  'MXN': 'мексиканский песо',
  'ARS': 'аргентинский песо',
};

interface ExchangeRates {
  rates: Record<string, number>;
  timestamp: number;
}

class CurrencyService {
  private rates: ExchangeRates | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 час
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  private loadingPromise: Promise<void> | null = null;

  async loadRates(): Promise<void> {
    // Если уже загружается - ждем
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Проверяем кеш
    if (this.rates && Date.now() - this.rates.timestamp < this.CACHE_DURATION) {
      return;
    }

    // Загружаем
    this.loadingPromise = this.fetchRates();
    await this.loadingPromise;
    this.loadingPromise = null;
  }

  private async fetchRates(): Promise<void> {
    try {
      const response = await axios.get(this.API_URL, { timeout: 10000 });
      this.rates = {
        rates: response.data.rates,
        timestamp: Date.now(),
      };
      console.log('✅ Курсы валют обновлены:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Ошибка загрузки курсов валют:', error);
      // Используем fallback курсы если API недоступен
      if (!this.rates) {
        this.rates = {
          rates: this.getFallbackRates(),
          timestamp: Date.now(),
        };
      }
    }
  }

  private getFallbackRates(): Record<string, number> {
    return {
      'USD': 1,
      'EUR': 0.92,
      'UAH': 41.5,
      'RUB': 95,
      'BYN': 3.3,
      'KZT': 480,
      'PLN': 4.1,
      'CZK': 23,
      'GBP': 0.79,
      'CAD': 1.38,
      'AUD': 1.54,
      'TRY': 32,
      'GEL': 2.7,
      'AMD': 390,
      'AZN': 1.7,
      'UZS': 12800,
      'MDL': 18,
      'BGN': 1.8,
      'RON': 4.6,
      'RSD': 108,
      'HUF': 360,
      'SEK': 10.5,
      'NOK': 11,
      'DKK': 6.9,
      'CHF': 0.88,
      'JPY': 150,
      'CNY': 7.2,
      'KRW': 1320,
      'INR': 83,
      'BRL': 5,
      'MXN': 17,
      'ARS': 850,
    };
  }

  /**
   * Конвертирует цену из долларов в указанную валюту
   */
  async convertFromUSD(amountUSD: number, toCurrency: string): Promise<number> {
    await this.loadRates();
    if (!this.rates || !this.rates.rates[toCurrency]) {
      return amountUSD;
    }
    return amountUSD * this.rates.rates[toCurrency];
  }

  /**
   * Конвертирует цену из любой валюты в доллары
   */
  async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    await this.loadRates();
    if (!this.rates || !this.rates.rates[fromCurrency]) {
      return amount;
    }
    return amount / this.rates.rates[fromCurrency];
  }

  /**
   * Получает валюту по стране
   */
  getCurrencyByCountry(country: string): string {
    return COUNTRY_CURRENCIES[country] || 'USD';
  }

  /**
   * Получает символ валюты
   */
  getCurrencySymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency] || currency;
  }

  /**
   * Получает название валюты
   */
  getCurrencyName(currency: string): string {
    return CURRENCY_NAMES[currency] || currency;
  }

  /**
   * Форматирует цену с двумя валютами (доллар + локальная)
   */
  async formatDualPrice(priceUSD: number, userCountry: string): Promise<string> {
    const localCurrency = this.getCurrencyByCountry(userCountry);
    
    // Если пользователь из США - показываем только доллары
    if (localCurrency === 'USD') {
      return `${this.getCurrencySymbol('USD')}${priceUSD.toFixed(0)}`;
    }

    // Конвертируем в локальную валюту
    const localPrice = await this.convertFromUSD(priceUSD, localCurrency);
    const localSymbol = this.getCurrencySymbol(localCurrency);

    // Форматируем в зависимости от размера числа
    const formattedLocal = localPrice >= 100 
      ? Math.round(localPrice).toLocaleString()
      : localPrice.toFixed(localPrice >= 10 ? 0 : 2);

    const formattedUSD = priceUSD >= 100 
      ? Math.round(priceUSD).toLocaleString()
      : priceUSD.toFixed(priceUSD >= 10 ? 0 : 2);

    // Разделяем валюты на разные строки для лучшей читаемости
    return `${localSymbol}${formattedLocal}\n≈ $${formattedUSD}`;
  }

  /**
   * Форматирует цену только в долларах (для формы добавления)
   */
  formatUSDPrice(priceUSD: number): string {
    const formatted = priceUSD >= 100 
      ? Math.round(priceUSD).toLocaleString()
      : priceUSD.toFixed(priceUSD >= 10 ? 0 : 2);
    return `$${formatted}`;
  }
}

export const currencyService = new CurrencyService();

// Автоматически загружаем курсы при старте приложения
currencyService.loadRates();

// Обновляем каждый час
setInterval(() => {
  currencyService.loadRates();
}, 60 * 60 * 1000);
