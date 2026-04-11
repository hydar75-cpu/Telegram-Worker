// كود وسيط تيليجرام - معدل ليعمل على Render.com
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN) {
  console.error('خطأ: BOT_TOKEN غير موجود في متغيرات البيئة');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // استخراج المسار الكامل بعد اسم النطاق
  const fullPath = req.url;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${fullPath}`);

  // بناء عنوان API الأصلي
  const targetUrl = `https://api.telegram.org${fullPath}`;

  // إعداد خيارات الطلب
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  // قراءة جسم الطلب إذا كان POST أو PUT
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    // استخدام http أو https حسب الحاجة
    const protocol = targetUrl.startsWith('https') ? require('https') : require('http');
    
    const proxyReq = protocol.request(targetUrl, options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('خطأ في الطلب إلى تيليجرام:', err.message);
      res.writeHead(500);
      res.end('Proxy Error');
    });

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

// الاستماع على المنفذ المحدد من Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 وسيط تيليجرام يعمل على المنفذ ${PORT}`);
});
