const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json({ limit: '10mb' }));

// تخزين أحدث بيانات من ESP32
let latestData = {};

// ========== 1. استقبال بيانات ESP32 ==========
app.post('/update', (req, res) => {
  latestData = req.body;
  console.log('Data received from ESP32');
  res.sendStatus(200);
});

// ========== 2. خدمة البيانات للمتصفح ==========
app.get('/api/data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(latestData);
});

// ========== 3. عرض صفحة الويب العامة ==========
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ========== 4. وسيط تيليغرام (يعيد توجيه جميع مسارات /bot) ==========
app.all('/bot*', async (req, res) => {
  try {
    const telegramURL = 'https://api.telegram.org' + req.originalUrl;
    const response = await axios({
      method: req.method,
      url: telegramURL,
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Telegram proxy error:', error.message);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
