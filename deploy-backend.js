const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = fs.readFileSync(path.join(__dirname, '.github-token'), 'utf8').trim();
const REPO_OWNER = 'Zaebatronik';
const REPO_NAME = 'KupiyProday';
const BRANCH = 'main';

console.log('🚀 Загрузка BACKEND на GitHub...\n');

// Список файлов backend для загрузки
const backendFiles = [
  'backend/package.json',
  'backend/server.js',
  'backend/src/server.js',
  'backend/src/models/User.js',
  'backend/src/models/Listing.js',
  'backend/src/models/Chat.js',
  'backend/src/models/Report.js',
  'backend/src/models/Notification.js',
  'backend/src/routes/users.js',
  'backend/src/routes/listings.js',
  'backend/src/routes/chats.js',
  'backend/src/routes/reports.js',
  'backend/src/routes/notifications.js',
  'backend/.env.example',
  'backend/README.md'
];

function uploadFile(filePath, content, message) {
  return new Promise((resolve, reject) => {
    // Получаем SHA файла если он существует
    const getOptions = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const getReq = https.request(getOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let sha = null;
        if (res.statusCode === 200) {
          sha = JSON.parse(data).sha;
        }

        // Загружаем или обновляем файл
        const contentBase64 = Buffer.from(content).toString('base64');
        const payload = JSON.stringify({
          message: message,
          content: contentBase64,
          branch: BRANCH,
          ...(sha && { sha })
        });

        const putOptions = {
          hostname: 'api.github.com',
          path: `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
          method: 'PUT',
          headers: {
            'User-Agent': 'Node.js',
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const putReq = https.request(putOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200 || res.statusCode === 201) {
              console.log(`✅ ${filePath}`);
              resolve();
            } else {
              console.log(`❌ ${filePath} (${res.statusCode})`);
              resolve(); // Продолжаем даже при ошибке
            }
          });
        });

        putReq.on('error', (err) => {
          console.log(`❌ ${filePath}: ${err.message}`);
          resolve();
        });

        putReq.write(payload);
        putReq.end();
      });
    });

    getReq.on('error', reject);
    getReq.end();
  });
}

// Основная функция
async function deployBackend() {
  let success = 0;
  let errors = 0;

  for (const file of backendFiles) {
    const fullPath = path.join(__dirname, file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  ${file} - не найден, пропускаем`);
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      await uploadFile(file, content, '🔥 CRITICAL FIX: Backend sync with Telegram ID + indexes');
      success++;
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.log(`❌ ${file}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Backend deploy: ${success} успешно, ${errors} ошибок`);
  console.log(`⏳ Render автоматически обновит backend через ~5-10 минут`);
  console.log(`🔗 Проверить: https://dashboard.render.com/web/srv-d4hh0b4hg0os738ebfvg`);
}

deployBackend().catch(console.error);
