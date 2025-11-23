const axios = require('axios');

const API_URL = 'https://kupiyproday.onrender.com';

const users = [
  {
    id: "670170626",
    nickname: "Администратор",
    country: "RU",
    city: "Система",
    radius: 0,
    language: "ru",
    contacts: {},
    banned: false
  }
];

async function migrateUsers() {
  console.log('🚀 Starting user migration...');
  
  for (const user of users) {
    try {
      console.log(`Adding user: ${user.nickname} (${user.id})`);
      const response = await axios.post(`${API_URL}/users`, user);
      console.log(`✅ Added: ${user.nickname}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️  User ${user.nickname} already exists`);
      } else {
        console.error(`❌ Error adding ${user.nickname}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log('✅ Migration complete!');
}

migrateUsers();
