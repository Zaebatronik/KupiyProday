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
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
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
  console.log('Пользователь подключился:', socket.id);

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`Пользователь присоединился к чату: ${chatId}`);
  });

  socket.on('send-message', (data) => {
    io.to(data.chatId).emit('new-message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
  });
});

// MongoDB подключение
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kupyprodai';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB подключен');
    httpServer.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения к MongoDB:', err);
    process.exit(1);
  });

module.exports = { app, io };
