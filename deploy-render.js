const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = fs.readFileSync('.github-token', 'utf8').trim();
const REPO = 'Zaebatronik/KupiyProday';

// Файлы для загрузки
const files = [
  'backend/src/server.js',
  'backend/package.json',
  'frontend/.env',
  'build.sh',
  'render.yaml'
];

let successCount = 0;
let errorCount = 0;

console.log('🚀 Uploading files for Render deployment...\n');

function uploadFile(filePath) {
  return new Promise((resolve) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const contentBase64 = Buffer.from(content).toString('base64');
    
    // Проверяем существует ли файл
    const getOptions = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/${filePath}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.request(getOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const sha = res.statusCode === 200 ? JSON.parse(data).sha : null;
        
        const payload = JSON.stringify({
          message: `Update ${filePath} for Render deployment`,
          content: contentBase64,
          branch: 'main',
          ...(sha && { sha })
        });

        const putOptions = {
          hostname: 'api.github.com',
          path: `/repos/${REPO}/contents/${filePath}`,
          method: 'PUT',
          headers: {
            'User-Agent': 'Node.js',
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        https.request(putOptions, (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ Uploaded: ${filePath}`);
            successCount++;
          } else {
            console.log(`❌ Failed: ${filePath} (${res.statusCode})`);
            errorCount++;
          }
          resolve();
        }).on('error', err => {
          console.error(`❌ Error: ${filePath}`, err.message);
          errorCount++;
          resolve();
        }).end(payload);
      });
    }).on('error', err => {
      console.error(`❌ Error: ${filePath}`, err.message);
      errorCount++;
      resolve();
    }).end();
  });
}

async function deployAll() {
  for (const file of files) {
    await uploadFile(file);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
  
  console.log(`\n📊 Deploy complete: ${successCount} success, ${errorCount} errors`);
  console.log('⏳ Render will redeploy in 1-2 minutes...');
  console.log('🔗 Check: https://dashboard.render.com/');
}

deployAll();
