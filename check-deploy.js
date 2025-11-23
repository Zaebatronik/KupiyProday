const https = require('https');

const checkUrl = 'kupiy-proday-jwpo.vercel.app';

https.get({
  hostname: checkUrl,
  path: '/goodbye',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes('GoodbyePage') || data.includes('Нам очень жаль')) {
      console.log('✅ GoodbyePage найдена на сервере!');
    } else if (res.statusCode === 200) {
      console.log('⚠️ Страница загружается, но возможно старая версия');
      console.log('Первые 500 символов:', data.substring(0, 500));
    } else {
      console.log('❌ Страница не найдена');
    }
  });
}).on('error', (err) => {
  console.error('❌ Ошибка:', err.message);
});
