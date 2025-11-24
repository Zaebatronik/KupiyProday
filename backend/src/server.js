const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Увеличен лимит для base64 фото
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Делаем io доступным для всех роутов
app.set('io', io);
global.io = io; // Делаем io глобальным для доступа из других модулей

// Routes - добавляем как с префиксом /api, так и без для совместимости
const usersRouter = require('./routes/users');
const listingsRouter = require('./routes/listings');
const chatsRouter = require('./routes/chats');
const reportsRouter = require('./routes/reports');
const notificationsRouter = require('./routes/notifications');

// С префиксом /api (старый формат)
app.use('/api/users', usersRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);

// Без префикса /api (новый формат для совместимости)
app.use('/users', usersRouter);
app.use('/listings', listingsRouter);
app.use('/chats', chatsRouter);
app.use('/reports', reportsRouter);
app.use('/notifications', notificationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from frontend (dist in root)
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));

// All other routes return the index.html (SPA)
app.get('*', (req, res) => {
  // Если это API запрос, не отдаем index.html
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Socket.IO для чатов
io.on('connection', (socket) => {
  console.log('✅ Пользователь подключился к Socket.IO:', socket.id);

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`📥 Пользователь ${socket.id} присоединился к чату: ${chatId}`);
    // Уведомляем пользователя что он успешно присоединился
    socket.emit('joined-chat', { chatId, socketId: socket.id });
  });

  socket.on('send-message', (data) => {
    console.log('📨 Socket.IO: Получено сообщение для отправки:', {
      chatId: data.chatId,
      messagePreview: data.message?.text?.substring(0, 50)
    });
    // Отправляем сообщение всем в комнате чата (включая отправителя для подтверждения)
    io.to(data.chatId).emit('new-message', data.message);
    console.log('📡 Socket.IO: Сообщение отправлено в комнату:', data.chatId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Пользователь отключился от Socket.IO:', socket.id);
  });
});

// MongoDB подключение
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kupyprodai';

console.log('🔧 Конфигурация сервера:');
console.log('   PORT:', PORT);
console.log('   MONGODB_URI:', MONGODB_URI ? `${MONGODB_URI.substring(0, 20)}...` : 'НЕ УСТАНОВЛЕН');
console.log('   NODE_ENV:', process.env.NODE_ENV);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB успешно подключен');
    console.log('📊 База данных готова к работе');
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📡 Доступен по адресу: http://0.0.0.0:${PORT}`);
      console.log('🔄 Роуты доступны:');
      console.log('   GET  /health');
      console.log('   GET  /users');
      console.log('   POST /users/register');
      console.log('   GET  /api/users (legacy)');
    });
  })
  .catch((err) => {
    console.error('❌ Критическая ошибка подключения к MongoDB:', err.message);
    console.error('💡 Проверьте переменную окружения MONGODB_URI в Render');
    process.exit(1);
  });

module.exports = { app, io };
