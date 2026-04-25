const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json({ limit: '10mb' }));

// تخزين بيانات الطاقة والمياه
let latestData = {};
let latestWaterData = {};

// ========== استقبال بيانات الطاقة من ESP32 ==========
app.post('/update', (req, res) => {
  latestData = req.body;
  console.log('Energy data received');
  res.sendStatus(200);
});

// ========== استقبال بيانات المياه من ESP32 ==========
app.post('/update-water', (req, res) => {
  latestWaterData = req.body;
  console.log('Water data received');
  res.sendStatus(200);
});

// ========== خدمة بيانات الطاقة للمتصفح ==========
app.get('/api/data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(latestData);
});

// ========== خدمة بيانات المياه للمتصفح ==========
app.get('/api/water/data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(latestWaterData);
});

// ========== عرض صفحة الطاقة ==========
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ========== عرض صفحة المياه ==========
app.get('/water', (req, res) => {
  res.sendFile(__dirname + '/water.html');
});

// ========== وسيط تيليغرام (يبقى كما هو) ==========
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
