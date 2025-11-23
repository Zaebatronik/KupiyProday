const https = require('https');

// Для использования этого скрипта нужен Vercel Token
// Получить можно здесь: https://vercel.com/account/tokens
// Сохраните токен в файл .vercel-token

const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, '.vercel-token');

if (!fs.existsSync(tokenPath)) {
  console.log('❌ Файл .vercel-token не найден!');
  console.log('');
  console.log('Создайте файл .vercel-token в папке проекта и вставьте туда Vercel API Token');
  console.log('Получить токен можно здесь: https://vercel.com/account/tokens');
  console.log('');
  console.log('Или используйте ручной redeploy через веб-интерфейс:');
  console.log('https://vercel.com/zaebatronik/kupiy-proday');
  process.exit(1);
}

const VERCEL_TOKEN = fs.readFileSync(tokenPath, 'utf8').trim();
const PROJECT_NAME = 'kupiy-proday-jwpo';

// Получаем ID проекта
const getProjectId = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: '/v9/projects',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const projects = JSON.parse(data).projects;
          const project = projects.find(p => p.name.includes('kupiy-proday') || p.name.includes('KupiyProday'));
          if (project) {
            console.log('✅ Проект найден:', project.name);
            resolve(project.id);
          } else {
            reject(new Error('Проект не найден'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Запускаем redeploy
const triggerRedeploy = (projectId) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      name: 'kupiy-proday',
      target: 'production'
    });

    const options = {
      hostname: 'api.vercel.com',
      path: `/v13/deployments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const deployment = JSON.parse(data);
          console.log('✅ Redeploy запущен!');
          console.log('🔗 URL:', deployment.url);
          console.log('⏳ Ожидайте 3-5 минут...');
          resolve(deployment);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

// Запуск
console.log('🚀 Запуск Vercel Redeploy...\n');

getProjectId()
  .then(projectId => triggerRedeploy(projectId))
  .catch(error => {
    console.error('❌ Ошибка:', error.message);
    console.log('\n💡 Используйте ручной redeploy через веб-интерфейс:');
    console.log('https://vercel.com/zaebatronik');
  });
