import fs from 'node:fs/promises';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();

// Middleware: لقراءة JSON من body
app.use(bodyParser.json());

// Middleware: للسماح بالـ CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// **Middleware: لخدمة الملفات الثابتة (الصور)**
app.use(express.static('public'));  

// Endpoint: إرجاع كل الوجبات
app.get('/meals', async (req, res) => {
  try {
    const meals = await fs.readFile('./data/available-meals.json', 'utf8');
    res.json(JSON.parse(meals));
  } catch (error) {
    res.status(500).json({ message: 'Failed to load meals.' });
  }
});

// Endpoint: إنشاء أوردر جديد
app.post('/orders', async (req, res) => {
  const orderData = req.body.order;

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ message: 'No items in order.' });
  }

  const customer = orderData.customer;
  if (
    !customer ||
    !customer.name?.trim() ||
    !customer.email?.includes('@') ||
    !customer.street?.trim() ||
    !customer['postal-code']?.trim() ||
    !customer.city?.trim()
  ) {
    return res.status(400).json({
      message: 'Missing customer info: name, email, street, postal code, city.',
    });
  }

  try {
    const ordersFile = './data/orders.json';
    const ordersRaw = await fs.readFile(ordersFile, 'utf8').catch(() => '[]');
    const allOrders = JSON.parse(ordersRaw);

    const newOrder = { ...orderData, id: Date.now().toString() };
    allOrders.push(newOrder);

    await fs.writeFile(ordersFile, JSON.stringify(allOrders, null, 2));
    res.status(201).json({ message: 'Order saved!', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save order.' });
  }
});

// Endpoint: إرجاع كل الأوردرات
app.get('/orders', async (req, res) => {
  try {
    const ordersRaw = await fs.readFile('./data/orders.json', 'utf8').catch(() => '[]');
    const allOrders = JSON.parse(ordersRaw);
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load orders.' });
  }
});

// Handle OPTIONS and 404
app.use((req, res) => {
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  res.status(404).json({ message: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));