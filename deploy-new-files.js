const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = fs.readFileSync(path.join(__dirname, '.github-token'), 'utf8').trim();
const REPO_OWNER = 'Zaebatronik';
const REPO_NAME = 'KupiyProday';
const BRANCH = 'main';

console.log('🚀 Загрузка НОВЫХ ФАЙЛОВ на GitHub...\n');

// Новые файлы (уведомления, стили, и т.д.)
const newFiles = [
  'frontend/src/pages/NotificationsPage.tsx',
  'frontend/src/pages/BannedPage.tsx',
  'frontend/src/styles/NotificationsPage.css',
  'frontend/src/styles/BannedPage.css',
  'frontend/.env',
  'frontend/.env.example',
  'CRITICAL_FIX_README.md',
  'QUICK_DEPLOY.md',
  'SUMMARY.md',
  'TEST_API.md',
  'deploy-backend.js',
  'deploy-fix.ps1',
  'deploy-fix.bat',
  'test-api.ps1'
];

function uploadFile(filePath, content, message) {
  return new Promise((resolve, reject) => {
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
              resolve();
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

async function deployNewFiles() {
  let success = 0;
  let errors = 0;

  for (const file of newFiles) {
    const fullPath = path.join(__dirname, file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  ${file} - не найден, пропускаем`);
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      await uploadFile(file, content, '✨ NEW: Notifications + Search improvements + Docs');
      success++;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.log(`❌ ${file}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 New files: ${success} успешно, ${errors} ошибок`);
  console.log(`⏳ Vercel/Netlify обновятся автоматически через ~2-3 минуты`);
}

deployNewFiles().catch(console.error);
