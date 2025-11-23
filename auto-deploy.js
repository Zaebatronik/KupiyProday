const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = fs.readFileSync(path.join(__dirname, '.github-token'), 'utf8').trim();
const REPO_OWNER = 'Zaebatronik';
const REPO_NAME = 'KupiyProday';
const BRANCH = 'main';

// Функция для загрузки файла на GitHub
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

        const putReq = https.request(putOptions, (putRes) => {
          let putData = '';
          putRes.on('data', chunk => putData += chunk);
          putRes.on('end', () => {
            if (putRes.statusCode === 200 || putRes.statusCode === 201) {
              resolve({ success: true, file: filePath });
            } else {
              reject(new Error(`Failed to upload ${filePath}: ${putRes.statusCode} ${putData}`));
            }
          });
        });

        putReq.on('error', reject);
        putReq.write(payload);
        putReq.end();
      });
    });

    getReq.on('error', reject);
    getReq.end();
  });
}

// Функция для загрузки всех измененных файлов
async function deployFiles() {
  console.log('🚀 Starting auto-deploy...\n');

  const filesToDeploy = [
    { local: 'frontend/package.json', remote: 'package.json' },
    { local: 'frontend/vite.config.ts', remote: 'vite.config.ts' },
    { local: 'frontend/tsconfig.json', remote: 'tsconfig.json' },
    { local: 'frontend/tsconfig.node.json', remote: 'tsconfig.node.json' },
    { local: 'frontend/vercel.json', remote: 'vercel.json' },
    { local: 'frontend/index.html', remote: 'index.html' },
    { local: 'frontend/src/main.tsx', remote: 'src/main.tsx' },
    { local: 'frontend/src/vite-env.d.ts', remote: 'src/vite-env.d.ts' },
    { local: 'frontend/src/App.tsx', remote: 'src/App.tsx' },
    { local: 'frontend/src/types/index.ts', remote: 'src/types/index.ts' },
    { local: 'frontend/src/store/index.ts', remote: 'src/store/index.ts' },
    { local: 'frontend/src/services/api.ts', remote: 'src/services/api.ts' },
    { local: 'frontend/src/i18n/index.ts', remote: 'src/i18n/index.ts' },
    { local: 'frontend/src/i18n/locales/ru.json', remote: 'src/i18n/locales/ru.json' },
    { local: 'frontend/src/i18n/locales/en.json', remote: 'src/i18n/locales/en.json' },
    { local: 'frontend/src/i18n/locales/uk.json', remote: 'src/i18n/locales/uk.json' },
    { local: 'frontend/src/i18n/locales/de.json', remote: 'src/i18n/locales/de.json' },
    { local: 'frontend/src/i18n/locales/fr.json', remote: 'src/i18n/locales/fr.json' },
    { local: 'frontend/src/i18n/locales/es.json', remote: 'src/i18n/locales/es.json' },
    { local: 'frontend/src/i18n/locales/pl.json', remote: 'src/i18n/locales/pl.json' },
    { local: 'frontend/src/pages/WelcomePage.tsx', remote: 'src/pages/WelcomePage.tsx' },
    { local: 'frontend/src/pages/MainMenu.tsx', remote: 'src/pages/MainMenu.tsx' },
    { local: 'frontend/src/pages/AgreementPage.tsx', remote: 'src/pages/AgreementPage.tsx' },
    { local: 'frontend/src/pages/CountryPage.tsx', remote: 'src/pages/CountryPage.tsx' },
    { local: 'frontend/src/pages/CityPage.tsx', remote: 'src/pages/CityPage.tsx' },
    { local: 'frontend/src/pages/RadiusPage.tsx', remote: 'src/pages/RadiusPage.tsx' },
    { local: 'frontend/src/pages/NicknamePage.tsx', remote: 'src/pages/NicknamePage.tsx' },
    { local: 'frontend/src/pages/CatalogPage.tsx', remote: 'src/pages/CatalogPage.tsx' },
    { local: 'frontend/src/pages/ListingDetailPage.tsx', remote: 'src/pages/ListingDetailPage.tsx' },
    { local: 'frontend/src/pages/AddListingPage.tsx', remote: 'src/pages/AddListingPage.tsx' },
    { local: 'frontend/src/pages/MyListingsPage.tsx', remote: 'src/pages/MyListingsPage.tsx' },
    { local: 'frontend/src/pages/ProfilePage.tsx', remote: 'src/pages/ProfilePage.tsx' },
    { local: 'frontend/src/pages/FavoritesPage.tsx', remote: 'src/pages/FavoritesPage.tsx' },
    { local: 'frontend/src/pages/SupportPage.tsx', remote: 'src/pages/SupportPage.tsx' },
    { local: 'frontend/src/pages/ChatPage.tsx', remote: 'src/pages/ChatPage.tsx' },
    { local: 'frontend/src/pages/AdminPage.tsx', remote: 'src/pages/AdminPage.tsx' },
    { local: 'frontend/src/pages/GoodbyePage.tsx', remote: 'src/pages/GoodbyePage.tsx' },
    { local: 'frontend/src/styles/WelcomePage.css', remote: 'src/styles/WelcomePage.css' },
    { local: 'frontend/src/styles/GoodbyePage.css', remote: 'src/styles/GoodbyePage.css' },
    { local: 'frontend/src/styles/MainMenu.css', remote: 'src/styles/MainMenu.css' },
    { local: 'frontend/src/styles/index.css', remote: 'src/styles/index.css' },
    { local: 'frontend/src/styles/AgreementPage.css', remote: 'src/styles/AgreementPage.css' },
    { local: 'frontend/src/styles/CountryPage.css', remote: 'src/styles/CountryPage.css' },
    { local: 'frontend/src/styles/CityPage.css', remote: 'src/styles/CityPage.css' },
    { local: 'frontend/src/styles/RadiusPage.css', remote: 'src/styles/RadiusPage.css' },
    { local: 'frontend/src/styles/CatalogPage.css', remote: 'src/styles/CatalogPage.css' },
    { local: 'frontend/src/styles/AddListingPage.css', remote: 'src/styles/AddListingPage.css' },
    { local: 'frontend/src/styles/MyListingsPage.css', remote: 'src/styles/MyListingsPage.css' },
    { local: 'frontend/src/styles/AdminPage.css', remote: 'src/styles/AdminPage.css' },
    { local: 'frontend/.trigger', remote: '.trigger' }
  ];

  const timestamp = new Date().toLocaleString('ru-RU');
  let successCount = 0;
  let errorCount = 0;

  for (const file of filesToDeploy) {
    try {
      const localPath = path.join(__dirname, file.local);
      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  Skip: ${file.local} (not found)`);
        continue;
      }

      const content = fs.readFileSync(localPath, 'utf8');
      await uploadFile(file.remote, content, `Auto-deploy: ${file.remote} - ${timestamp}`);
      console.log(`✅ Uploaded: ${file.remote}`);
      successCount++;
      
      // Задержка чтобы не превысить rate limit GitHub API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error uploading ${file.local}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Deploy complete: ${successCount} success, ${errorCount} errors`);
  console.log('⏳ Vercel will redeploy in 2-3 minutes...');
  console.log('🔗 Check: https://kupiy-proday-jwpo.vercel.app\n');
}

deployFiles().catch(console.error);
