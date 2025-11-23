const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = fs.readFileSync('.github-token', 'utf8').trim();
const content = fs.readFileSync('frontend/netlify.toml', 'utf8');
const contentBase64 = Buffer.from(content).toString('base64');

const options = {
  hostname: 'api.github.com',
  path: '/repos/Zaebatronik/KupiyProday/contents/frontend/netlify.toml',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js',
    'Authorization': 	oken ,
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const sha = res.statusCode === 200 ? JSON.parse(data).sha : null;
    const payload = JSON.stringify({
      message: '🔧 Fix netlify.toml: set base directory to frontend',
      content: contentBase64,
      branch: 'main',
      ...(sha && { sha })
    });

    const putOptions = {
      hostname: 'api.github.com',
      path: '/repos/Zaebatronik/KupiyProday/contents/frontend/netlify.toml',
      method: 'PUT',
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': 	oken ,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    https.request(putOptions, (res) => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ netlify.toml uploaded!');
      } else {
        console.log('❌ Error:', res.statusCode);
      }
    }).on('error', console.error).end(payload);
  });
}).on('error', console.error).end();
