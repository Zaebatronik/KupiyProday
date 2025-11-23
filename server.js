const jsonServer = require('json-server');
const cors = require('cors');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Enable CORS for all origins (для доступа из Telegram WebApp)
server.use(cors({
  origin: '*',
  credentials: true
}));

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Логирование всех запросов
server.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  next();
});

server.use(router);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 JSON Server запущен на http://localhost:${PORT}`);
  console.log(`📊 База данных: db.json`);
  console.log(`\n📍 API Endpoints:`);
  console.log(`   GET    /users          - Все пользователи`);
  console.log(`   GET    /users/:id      - Пользователь по ID`);
  console.log(`   POST   /users          - Создать пользователя`);
  console.log(`   GET    /listings       - Все объявления`);
  console.log(`   GET    /listings/:id   - Объявление по ID`);
  console.log(`   POST   /listings       - Создать объявление`);
  console.log(`   PUT    /listings/:id   - Обновить объявление`);
  console.log(`   DELETE /listings/:id   - Удалить объявление`);
  console.log(`\n⚠️  Чтобы приложение работало с других устройств:`);
  console.log(`   1. Узнай свой локальный IP: ipconfig`);
  console.log(`   2. В frontend/.env укажи: VITE_API_URL=http://ВАШ_IP:3001`);
});
