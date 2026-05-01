const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json({ limit: '10mb' }));

// تخزين بيانات الطاقة والمياه
let latestData = {
  minuteData: []  // تهيئة افتراضية فارغة لتجنب الاختفاء
};
let latestWaterData = {};

// ========== استقبال بيانات الطاقة من ESP32 مع الدمج الذكي ==========
app.post('/update', (req, res) => {
  const body = req.body;
  
  // إذا كان تحديث الخريطة فقط (minuteUpdate)
  if (body.type === 'minuteUpdate') {
    if (body.minuteData && Array.isArray(body.minuteData)) {
      latestData.minuteData = body.minuteData;      // حفظ آخر خريطة حقيقية
    }
    // تحديث الحقول الإحصائية المصاحبة (إن وجدت)
    if (body.morningActive !== undefined) {
      latestData.morningActive = body.morningActive;
      latestData.morningInactive = body.morningInactive;
      latestData.eveningActive = body.eveningActive;
      latestData.eveningInactive = body.eveningInactive;
    }
    if (body.currentTime) latestData.currentTime = body.currentTime;
    console.log('Minute data updated');
  } 
  // إذا كان تحديثاً سريعاً (fastUpdate) أو قديماً (بدون type)
  else {
    // دمج جميع الحقول الواردة مع الحفاظ على آخر minuteData موجودة
    const { minuteData, ...rest } = body;   // نزيل minuteData من التحديث السريع إن وُجدت
    Object.assign(latestData, rest);        // نُحدث باقي الحقول
    // لا نلمس latestData.minuteData (يحتفظ بالقيمة السابقة)
    console.log('Fast update received');
  }
  
  res.sendStatus(200);
});

// ========== استقبال بيانات المياه من ESP32 (بدون تغيير) ==========
app.post('/update-water', (req, res) => {
  latestWaterData = req.body;
  console.log('Water data received');
  res.sendStatus(200);
});

// ========== خدمة بيانات الطاقة للمتصفح ==========
app.get('/api/data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  // إرسال البيانات مع ضمان وجود minuteData (حتى لو كانت فارغة)
  res.json({
    ...latestData,
    minuteData: latestData.minuteData || []   // إن لم توجد بعد، نرسل مصفوفة فارغة
  });
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

// ========== وسيط تيليغرام ==========
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
