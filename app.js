const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const products = [
  {
    id: 1,
    name: 'Ultimate Desktop PC',
    category: 'Computer',
    price: 899.0,
    image: 'images/product1.png',
    rating: 4.7,
    shortDescription: 'High-performance desktop for home and office.',
    description: 'A powerful desktop machine with a modern processor, fast SSD storage, and reliable graphics for productivity and entertainment.',
    features: ['Intel Core i7', '16GB RAM', '512GB NVMe SSD', 'Windows 11 Ready']
  },
  {
    id: 2,
    name: 'Pro Laptop',
    category: 'Laptop',
    price: 1099.0,
    image: 'images/product2.png',
    rating: 4.8,
    shortDescription: 'Portable laptop for work, design, and study.',
    description: 'A slim and lightweight laptop with a crisp display, long battery life, and enough power to handle everyday productivity.',
    features: ['Intel Core i5', '8GB RAM', '256GB SSD', '14-inch FHD screen']
  },
  {
    id: 3,
    name: 'Smart Tablet',
    category: 'Tablet',
    price: 349.0,
    image: 'images/product3.png',
    rating: 4.4,
    shortDescription: 'Portable tablet for media and browsing.',
    description: 'A compact tablet with a vivid touchscreen, great speakers, and a lightweight design for on-the-go use.',
    features: ['10-inch display', '64GB storage', 'Quad-core processor', 'Wi-Fi + Bluetooth']
  },
  {
    id: 4,
    name: 'Premium Speakers',
    category: 'Audio',
    price: 129.0,
    image: 'images/product4.png',
    rating: 4.5,
    shortDescription: 'Crisp sound for music and movies.',
    description: 'A stylish speaker set with rich audio, premium build quality, and wired connectivity for your desktop or laptop.',
    features: ['Stereo sound', 'Low distortion', 'Compact design', '3.5mm AUX input']
  },
  {
    id: 5,
    name: 'High-Speed Router',
    category: 'Networking',
    price: 79.0,
    image: 'images/product5.png',
    rating: 4.2,
    shortDescription: 'Fast internet connectivity for home.',
    description: 'A modern router offering stable wireless coverage and easy setup for streaming, working, and gaming.',
    features: ['Dual-band Wi-Fi', '4 LAN ports', 'Easy setup app', 'Parental controls']
  },
  {
    id: 6,
    name: 'External Hard Drive',
    category: 'Storage',
    price: 69.0,
    image: 'images/product6.png',
    rating: 4.6,
    shortDescription: 'Reliable portable storage.',
    description: 'A compact external drive with fast transfer speeds and durable design to keep all your files safe.',
    features: ['1TB capacity', 'USB 3.0', 'Compact chassis', 'Plug and play']
  },
  {
    id: 7,
    name: 'Performance RAM',
    category: 'Memory',
    price: 79.0,
    image: 'images/product7.png',
    rating: 4.6,
    shortDescription: 'Memory upgrade for faster performance.',
    description: 'A fast RAM upgrade designed to improve multitasking, gaming, and system responsiveness on desktops.',
    features: ['16GB DDR4', '3200MHz speed', 'Low latency', 'Easy installation']
  },
  {
    id: 8,
    name: 'Portable Battery Pack',
    category: 'Accessories',
    price: 39.0,
    image: 'images/product8.png',
    rating: 4.3,
    shortDescription: 'Extra battery power for mobile devices.',
    description: 'A compact power bank with multiple ports and fast charging support for smartphones and tablets.',
    features: ['10000mAh', 'Dual USB ports', 'LED power indicator', 'Quick charge']
  },
  {
    id: 9,
    name: 'USB Flash Drive',
    category: 'Storage',
    price: 19.0,
    image: 'images/product9.png',
    rating: 4.4,
    shortDescription: 'Fast and portable USB storage.',
    description: 'A durable flash drive that delivers fast read/write speeds and easy portability for everyday file sharing.',
    features: ['64GB capacity', 'USB 3.1', 'Compact design', 'Data protection']
  }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((item) => item.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.post('/api/checkout', (req, res) => {
  const { cart } = req.body;
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const orderId = `EADC-${Date.now()}`;
  const order = {
    orderId,
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date().toISOString()
  };

  try {
    const ordersPath = path.join(dataDir, 'orders.json');
    const orders = fs.existsSync(ordersPath) ? JSON.parse(fs.readFileSync(ordersPath, 'utf8')) : [];
    orders.push(order);
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
  } catch (_) { }

  res.json({ success: true, orderId, itemCount: cart.reduce((total, item) => total + item.quantity, 0) });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const entry = { name, email, message, createdAt: new Date().toISOString() };

  try {
    const contactsPath = path.join(dataDir, 'contacts.json');
    const contacts = fs.existsSync(contactsPath) ? JSON.parse(fs.readFileSync(contactsPath, 'utf8')) : [];
    contacts.push(entry);
    fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
  } catch (_) { }

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
