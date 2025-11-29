// Простой Telegram бот для команды /start
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN || '7939786678:AAHSujmve3UREb9YLpZZWY2fiA00qUj0Fz8';
// Cache busting: добавляем версию и timestamp чтобы Telegram не кэшировал
const webAppUrl = `https://kupyprodai.pages.dev?v=2.0.2&t=${Date.now()}`;

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram Bot запущен!');
console.log(`📱 WebApp URL: ${webAppUrl}`);

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'no username';
  const firstName = msg.from.first_name || '';
  
  console.log(`👤 /start от пользователя: ID=${userId}, @${username}, ${firstName}`);
  
  const message = 
    '🐻 Добро пожаловать в Берлогу!\n' +
    '🐻 Welcome to Berloga!\n' +
    '🐻 Willkommen bei Berloga!\n\n' +
    '🛍️ Маркетплейс вашего района | Local marketplace | Lokaler Marktplatz\n' +
    '📍 Покупайте и продавайте товары рядом с вами\n' +
    '📍 Buy and sell items near you\n' +
    '📍 Kaufen und verkaufen Sie in Ihrer Nähe\n\n' +
    '👇 Нажмите кнопку ниже | Press the button below | Drücken Sie die Taste unten:';
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ Открыть Берлогу | Open Berloga', web_app: { url: webAppUrl } }]
      ]
    }
  }).then(() => {
    console.log(`✅ Приветствие отправлено пользователю ${userId}`);
  }).catch(err => {
    console.error(`❌ Ошибка отправки сообщения: ${err.message}`);
  });
});

// Команда /app
bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🛍️ Открыть приложение | Open App:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ Открыть Берлогу', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Останавливаю бота...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Останавливаю бота...');
  bot.stopPolling();
  process.exit(0);
});
