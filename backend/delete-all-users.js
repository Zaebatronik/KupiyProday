/**
 * Скрипт для удаления ВСЕХ пользователей и чатов из базы данных
 * ВНИМАНИЕ: Это необратимая операция!
 */

const mongoose = require('mongoose');

// MongoDB Atlas URI
const MONGO_URI = 'mongodb+srv://kamarovdanila228:JybumQhsIGOGEzK6@kupyprodai.1iomu.mongodb.net/kupyprodai?retryWrites=true&w=majority';

async function deleteAllUsers() {
  try {
    console.log('🔌 Подключение к MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Подключено к MongoDB');

    // Определяем схемы
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const ChatSchema = new mongoose.Schema({}, { strict: false });
    const ListingSchema = new mongoose.Schema({}, { strict: false });

    const User = mongoose.model('User', UserSchema);
    const Chat = mongoose.model('Chat', ChatSchema);
    const Listing = mongoose.model('Listing', ListingSchema);

    // Считаем текущее количество
    const userCount = await User.countDocuments();
    const chatCount = await Chat.countDocuments();
    const listingCount = await Listing.countDocuments();

    console.log('📊 Текущее состояние базы данных:');
    console.log(`   - Пользователей: ${userCount}`);
    console.log(`   - Чатов: ${chatCount}`);
    console.log(`   - Объявлений: ${listingCount}`);

    console.log('\n🗑️  УДАЛЕНИЕ ВСЕХ ДАННЫХ...');

    // Удаляем всех пользователей
    const deletedUsers = await User.deleteMany({});
    console.log(`✅ Удалено пользователей: ${deletedUsers.deletedCount}`);

    // Удаляем все чаты
    const deletedChats = await Chat.deleteMany({});
    console.log(`✅ Удалено чатов: ${deletedChats.deletedCount}`);

    // Удаляем все объявления
    const deletedListings = await Listing.deleteMany({});
    console.log(`✅ Удалено объявлений: ${deletedListings.deletedCount}`);

    console.log('\n✨ База данных полностью очищена!');
    console.log('ℹ️  Теперь можно начать регистрацию заново');

    await mongoose.disconnect();
    console.log('🔌 Отключено от MongoDB');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

deleteAllUsers();
