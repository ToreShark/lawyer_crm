import * as crypto from 'crypto';

const botToken = '8169522521:AAH8HXmpHTQ-fGp0RgdasplGE5T94R_eOQs';

const authData = {
  id: '376068212',
  first_name: 'Tor',
  last_name: 'Mot',
  username: 'tor_mot',
  photo_url: 'https://t.me/i/userpic/320/tor_mot.jpg',
  auth_date: Math.floor(Date.now() / 1000).toString(), // ✅ Текущее время
};

console.log('📅 Auth date:', authData.auth_date);
console.log('📅 Human readable:', new Date(parseInt(authData.auth_date) * 1000));

// 📦 1. Составляем data_check_string
const dataCheckString = Object.entries(authData)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

console.log('📝 Data check string:\n', dataCheckString);

// 🔐 2. Генерируем secret_key
const secretKey = crypto.createHash('sha256').update(botToken).digest();

// 🔑 3. Считаем HMAC SHA256
const hash = crypto
  .createHmac('sha256', secretKey)
  .update(dataCheckString)
  .digest('hex');

console.log('🔐 Generated Telegram Hash:', hash);

// 📋 Готовый JSON для запроса
const telegramAuthData = {
  ...authData,
  hash
};

console.log('\n📤 JSON для POST запроса:');
console.log(JSON.stringify(telegramAuthData, null, 2));