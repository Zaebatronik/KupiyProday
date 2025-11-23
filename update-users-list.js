const fs = require('fs');
const path = require('path');

// Путь к файлам
const DB_PATH = path.join(__dirname, 'db.json');
const USERS_TXT_PATH = path.join(__dirname, 'users_list.txt');

// Функция обновления текстового файла
function updateUsersList() {
  try {
    // Читаем базу данных
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const users = dbData.users || [];

    // Формируем содержимое текстового файла
    let content = '========================================\n';
    content += '     ЗАРЕГИСТРИРОВАННЫЕ ПОЛЬЗОВАТЕЛИ\n';
    content += '========================================\n\n';
    content += 'Этот файл автоматически обновляется при регистрации новых пользователей.\n';
    content += `Последнее обновление: ${new Date().toLocaleString('ru-RU')}\n\n`;
    content += `Всего пользователей: ${users.length}\n\n`;
    content += '----------------------------------------\n\n';

    // Добавляем информацию о каждом пользователе
    users.forEach((user, index) => {
      const isAdmin = user.id === '670170626';
      content += `${isAdmin ? '👑' : '👤'} Пользователь #${index + 1}${isAdmin ? ' (АДМИНИСТРАТОР)' : ''}\n`;
      content += `ID: ${user.id}\n`;
      content += `Ник: ${user.nickname}\n`;
      content += `Страна: ${user.country}\n`;
      content += `Город: ${user.city}\n`;
      content += `Радиус: ${user.radius} км\n`;
      content += `Язык: ${user.language}\n`;
      
      if (user.contacts) {
        if (user.contacts.telegram) content += `Telegram: ${user.contacts.telegram}\n`;
        if (user.contacts.phone) content += `Телефон: ${user.contacts.phone}\n`;
        if (user.contacts.email) content += `Email: ${user.contacts.email}\n`;
      }
      
      const date = new Date(user.createdAt);
      content += `Дата регистрации: ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}\n`;
      content += '\n----------------------------------------\n\n';
    });

    content += '========================================\n';
    content += 'Файл базы данных: db.json\n';
    content += 'Путь: ' + DB_PATH + '\n';
    content += '========================================\n';

    // Записываем в файл
    fs.writeFileSync(USERS_TXT_PATH, content, 'utf8');
    console.log(`✅ Файл users_list.txt обновлен. Пользователей: ${users.length}`);
  } catch (error) {
    console.error('❌ Ошибка обновления файла:', error);
  }
}

// Обновляем при запуске
updateUsersList();

// Следим за изменениями в db.json
console.log('👀 Слежу за изменениями в db.json...');
fs.watch(DB_PATH, (eventType) => {
  if (eventType === 'change') {
    console.log('📝 База данных изменена, обновляю users_list.txt...');
    setTimeout(updateUsersList, 500); // Задержка для завершения записи
  }
});

console.log('✅ Скрипт запущен! Нажми Ctrl+C для остановки.');
