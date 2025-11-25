/**
 * Автоматический тест системы чатов
 * Проверяет весь flow от регистрации до отправки сообщений
 */

const API_URL = 'https://kupiyproday.onrender.com';

// Генерируем уникальные ID для теста
const timestamp = Date.now();
const shortTimestamp = timestamp.toString().slice(-6); // Последние 6 цифр
const user1Id = `test1_${timestamp}`;
const user2Id = `test2_${timestamp}`;

let user1, user2, listing, chat;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  console.log('🧪 ========== НАЧАЛО АВТОТЕСТА ==========\n');

  try {
    // ========== ШАГ 1: Регистрация пользователя 1 ==========
    console.log('👤 ШАГ 1: Регистрация User1...');
    const user1Response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user1Id,
        telegramId: user1Id,
        nickname: `User1_${shortTimestamp}`,
        country: 'PL',
        city: 'Warsaw',
        radius: 10,
        language: 'en'
      })
    });

    if (!user1Response.ok) {
      const errorText = await user1Response.text();
      console.error(`❌ Response status: ${user1Response.status}`);
      console.error(`❌ Response body: ${errorText}`);
      throw new Error(`User1 регистрация failed: ${user1Response.status} - ${errorText}`);
    }

    user1 = await user1Response.json();
    console.log(`✅ User1 создан: ${user1.nickname} (ID: ${user1.id})\n`);

    // ========== ШАГ 2: Регистрация пользователя 2 ==========
    console.log('👤 ШАГ 2: Регистрация User2...');
    const user2Response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user2Id,
        telegramId: user2Id,
        nickname: `User2_${shortTimestamp}`,
        country: 'PL',
        city: 'Warsaw',
        radius: 10,
        language: 'en'
      })
    });

    if (!user2Response.ok) {
      throw new Error(`User2 регистрация failed: ${user2Response.status}`);
    }

    user2 = await user2Response.json();
    console.log(`✅ User2 создан: ${user2.nickname} (ID: ${user2.id})\n`);

    // ========== ШАГ 3: Создание объявления от User1 ==========
    console.log('📦 ШАГ 3: Создание объявления от User1...');
    const listingResponse = await fetch(`${API_URL}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user1Id,
        userNickname: user1.nickname,
        title: `Test ${shortTimestamp}`,
        description: 'Test listing for chat',
        price: 100,
        currency: 'PLN',
        category: 'electronics',
        condition: 'new',
        country: 'PL',
        city: 'Warsaw',
        photos: []
      })
    });

    if (!listingResponse.ok) {
      const errorText = await listingResponse.text();
      console.error(`❌ Listing response status: ${listingResponse.status}`);
      console.error(`❌ Listing response body: ${errorText}`);
      throw new Error(`Listing creation failed: ${listingResponse.status} - ${errorText}`);
    }

    listing = await listingResponse.json();
    console.log(`✅ Объявление создано: "${listing.title}" (ID: ${listing._id})\n`);

    // Небольшая задержка чтобы БД успела обновиться
    await delay(1000);

    // ========== ШАГ 4: Создание чата между User2 и User1 ==========
    console.log('💬 ШАГ 4: Создание чата между User2 (покупатель) и User1 (продавец)...');
    const chatResponse = await fetch(`${API_URL}/api/chats/find-or-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerId: user2Id,
        sellerId: user1Id,
        listingId: listing._id,
        buyerNickname: user2.nickname,
        sellerNickname: user1.nickname
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`Chat creation failed: ${chatResponse.status} - ${errorText}`);
    }

    chat = await chatResponse.json();
    console.log(`✅ Чат создан: ID ${chat._id}`);
    console.log(`   Участники: ${chat.participant1} <-> ${chat.participant2}\n`);

    // ========== ШАГ 5: User2 отправляет сообщение User1 ==========
    console.log('📨 ШАГ 5: User2 отправляет сообщение "Hello from User2!"...');
    const message1Response = await fetch(`${API_URL}/api/chats/${chat._id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user2Id,
        text: 'Hello from User2! This is a test message.'
      })
    });

    if (!message1Response.ok) {
      const errorText = await message1Response.text();
      throw new Error(`Message1 send failed: ${message1Response.status} - ${errorText}`);
    }

    const updatedChat1 = await message1Response.json();
    console.log(`✅ Сообщение отправлено! Всего сообщений в чате: ${updatedChat1.messages.length}`);
    console.log(`   Последнее: "${updatedChat1.messages[updatedChat1.messages.length - 1].text}"\n`);

    // Небольшая задержка для Socket.IO broadcast
    await delay(500);

    // ========== ШАГ 6: User1 отвечает User2 ==========
    console.log('📨 ШАГ 6: User1 отвечает "Hi User2! Got your message!"...');
    const message2Response = await fetch(`${API_URL}/api/chats/${chat._id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user1Id,
        text: 'Hi User2! Got your message!'
      })
    });

    if (!message2Response.ok) {
      const errorText = await message2Response.text();
      throw new Error(`Message2 send failed: ${message2Response.status} - ${errorText}`);
    }

    const updatedChat2 = await message2Response.json();
    console.log(`✅ Ответ отправлен! Всего сообщений в чате: ${updatedChat2.messages.length}`);
    console.log(`   Последнее: "${updatedChat2.messages[updatedChat2.messages.length - 1].text}"\n`);

    // ========== ШАГ 7: Проверка получения чата пользователями ==========
    console.log('🔍 ШАГ 7: Проверка что оба пользователя видят чат...');
    
    // User1 получает свои чаты
    const user1ChatsResponse = await fetch(`${API_URL}/api/chats/user/${user1Id}`);
    const user1Chats = await user1ChatsResponse.json();
    console.log(`✅ User1 видит ${user1Chats.length} чат(ов)`);

    // User2 получает свои чаты
    const user2ChatsResponse = await fetch(`${API_URL}/api/chats/user/${user2Id}`);
    const user2Chats = await user2ChatsResponse.json();
    console.log(`✅ User2 видит ${user2Chats.length} чат(ов)\n`);

    // ========== ШАГ 8: Финальная проверка чата ==========
    console.log('🔍 ШАГ 8: Финальная проверка содержимого чата...');
    const finalChatResponse = await fetch(`${API_URL}/api/chats/${chat._id}`);
    const finalChat = await finalChatResponse.json();

    console.log('\n🔍 DEBUG: Response status:', finalChatResponse.status);
    console.log('🔍 DEBUG: Response data:', JSON.stringify(finalChat, null, 2));

    console.log(`\n📊 ========== РЕЗУЛЬТАТЫ ТЕСТА ==========`);
    console.log(`✅ Чат ID: ${finalChat._id}`);
    console.log(`✅ Участник 1: ${finalChat.participant1}`);
    console.log(`✅ Участник 2: ${finalChat.participant2}`);
    console.log(`✅ Всего сообщений: ${finalChat.messages?.length || 0}`);
    
    if (finalChat.messages && finalChat.messages.length > 0) {
      console.log(`\n💬 Сообщения в чате:`);
      finalChat.messages.forEach((msg, index) => {
        const sender = msg.senderId === user1Id ? 'User1' : msg.senderId === user2Id ? 'User2' : 'System';
        console.log(`   ${index + 1}. [${sender}]: ${msg.text}`);
      });
    }

    console.log(`\n✅✅✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО! ✅✅✅\n`);

    // ========== ОЧИСТКА: Удаляем тестовые данные ==========
    console.log('🧹 Очистка тестовых данных...');
    
    await fetch(`${API_URL}/api/users/${user1Id}`, { method: 'DELETE' });
    await fetch(`${API_URL}/api/users/${user2Id}`, { method: 'DELETE' });
    await fetch(`${API_URL}/api/listings/${listing._id}`, { method: 'DELETE' });
    
    console.log('✅ Тестовые данные удалены\n');

  } catch (error) {
    console.error('\n❌ ========== ТЕСТ ПРОВАЛЕН ==========');
    console.error('❌ Ошибка:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Попытка очистки даже при ошибке
    if (user1) await fetch(`${API_URL}/api/users/${user1Id}`, { method: 'DELETE' }).catch(() => {});
    if (user2) await fetch(`${API_URL}/api/users/${user2Id}`, { method: 'DELETE' }).catch(() => {});
    if (listing) await fetch(`${API_URL}/api/listings/${listing._id}`, { method: 'DELETE' }).catch(() => {});
    
    process.exit(1);
  }
}

test();
