const https = require('https');

console.log('🔍 Проверка всех Vercel проектов...\n');

// Проверяем разные возможные URL
const urls = [
  'kupiy-proday-jwpo.vercel.app',
  'kupyprodai.vercel.app',
  'kupiy-proday.vercel.app',
  'kupyprodai-frontend.vercel.app',
  'kupiy-prodai.vercel.app'
];

function checkUrl(hostname) {
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      path: '/',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasReact = data.includes('root') || data.includes('React');
        const hasGoodbye = data.includes('goodbye') || data.includes('Берлога');
        const hasNewVersion = data.includes('build-version') || data.includes('2.0.1');
        
        resolve({
          url: hostname,
          status: res.statusCode,
          hasReact,
          hasGoodbye,
          hasNewVersion,
          age: res.headers.age || 'N/A',
          lastModified: res.headers['last-modified'] || 'N/A'
        });
      });
    });

    req.on('error', () => {
      resolve({ url: hostname, status: 'ERROR', hasReact: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url: hostname, status: 'TIMEOUT', hasReact: false });
    });

    req.end();
  });
}

async function checkAll() {
  console.log('Проверяю все возможные URL...\n');
  
  for (const url of urls) {
    const result = await checkUrl(url);
    
    console.log(`📍 ${result.url}`);
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log(`   React App: ${result.hasReact ? '✅' : '❌'}`);
      console.log(`   GoodbyePage: ${result.hasGoodbye ? '✅ НОВАЯ ВЕРСИЯ' : '❌ старая'}`);
      console.log(`   Build v2.0.1: ${result.hasNewVersion ? '✅ НОВАЯ' : '❌ старая'}`);
      console.log(`   Cache Age: ${result.age}s`);
      console.log(`   Modified: ${result.lastModified}`);
      
      if (result.hasNewVersion || result.hasGoodbye) {
        console.log(`   🎯 ЭТОТ URL АКТУАЛЬНЫЙ!`);
      }
    }
    
    console.log('');
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n💡 Используйте URL с ✅ НОВАЯ ВЕРСИЯ в настройках бота');
  console.log('💡 Если все URL старые - нужен redeploy на Vercel');
}

checkAll().catch(console.error);
