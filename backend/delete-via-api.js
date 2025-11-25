/**
 * Удаление всех пользователей через API
 */

const API_URL = 'https://kupiyproday.onrender.com';

async function deleteAllData() {
  try {
    console.log('🗑️  Удаление всех данных через API...');
    console.log('🌐 URL:', API_URL);

    // 1. Получаем всех пользователей
    console.log('\n📋 Получение списка пользователей...');
    const usersResponse = await fetch(`${API_URL}/api/users`);
    const users = await usersResponse.json();
    console.log(`✅ Найдено пользователей: ${users.length}`);

    // 2. Удаляем каждого пользователя
    console.log('\n🗑️  Удаление пользователей...');
    for (const user of users) {
      try {
        const userId = user.telegramId || user.id;
        const deleteResponse = await fetch(`${API_URL}/api/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Удалён: ${user.nickname} (ID: ${userId})`);
        } else {
          console.log(`❌ Ошибка удаления: ${user.nickname} (ID: ${userId})`);
        }
      } catch (err) {
        console.log(`❌ Ошибка: ${err.message}`);
      }
    }

    console.log('\n✨ Удаление завершено!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

deleteAllData();
