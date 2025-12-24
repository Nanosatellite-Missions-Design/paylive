const https = require('https');

const BOT_TOKEN = "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";

// Vérifier le webhook
const check = https.request({
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${BOT_TOKEN}/getWebhookInfo`,
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('🔍 État du webhook:', data));
});

check.end();