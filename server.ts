import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite database
const db = new Database('santo_cerdo.db');

// Setup tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    cost REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'natural',
    document_id TEXT,
    name TEXT NOT NULL,
    last_name TEXT,
    trade_name TEXT,
    email TEXT,
    phone TEXT,
    department TEXT,
    province TEXT,
    district TEXT,
    address TEXT,
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS customer_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    name TEXT,
    address TEXT NOT NULL,
    reference TEXT,
    department TEXT,
    province TEXT,
    district TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'percentage' or 'fixed'
    value REAL NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    active INTEGER DEFAULT 1
  );
`);

// Cleanup duplicate customers based on document_id, name, and last_name
try {
  db.exec(`
    DELETE FROM customers
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM customers
      GROUP BY COALESCE(document_id, ''), name, COALESCE(last_name, '')
    )
  `);
} catch (e) {
  // Ignore errors during cleanup
}

// Insert default user if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  db.prepare('INSERT INTO users (username, password, name) VALUES (?, ?, ?)').run('admin', 'admin', 'Administrador');
}

// Insert some initial data if empty
  // Migrations for customers table
  const customerMigrations = [
    "ALTER TABLE customers ADD COLUMN type TEXT NOT NULL DEFAULT 'natural'",
    "ALTER TABLE customers ADD COLUMN document_id TEXT",
    "ALTER TABLE customers ADD COLUMN last_name TEXT",
    "ALTER TABLE customers ADD COLUMN trade_name TEXT",
    "ALTER TABLE customers ADD COLUMN department TEXT",
    "ALTER TABLE customers ADD COLUMN province TEXT",
    "ALTER TABLE customers ADD COLUMN district TEXT",
    "ALTER TABLE customers ADD COLUMN reference TEXT",
    "ALTER TABLE customers ADD COLUMN address TEXT",
    "ALTER TABLE customers ADD COLUMN favorite_address_id INTEGER",
    "ALTER TABLE customers ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
  ];

  customerMigrations.forEach(migration => {
    try {
      db.exec(migration);
    } catch (e) {
      // Column likely already exists
    }
  });

  // Migrations for orders table
  const orderMigrations = [
    "ALTER TABLE orders ADD COLUMN delivery_address TEXT",
    "ALTER TABLE orders ADD COLUMN delivery_department TEXT",
    "ALTER TABLE orders ADD COLUMN delivery_province TEXT",
    "ALTER TABLE orders ADD COLUMN delivery_district TEXT",
    "ALTER TABLE orders ADD COLUMN delivery_reference TEXT",
    "ALTER TABLE orders ADD COLUMN promotion_id INTEGER",
    "ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0"
  ];

  orderMigrations.forEach(migration => {
    try {
      db.exec(migration);
    } catch (e) {
      // Column likely already exists
    }
  });

  // Populate existing orders with customer's primary address details if they are empty or incomplete
  try {
    db.exec(`
      UPDATE orders 
      SET delivery_address = COALESCE(delivery_address, (SELECT address FROM customers WHERE customers.id = orders.customer_id)),
          delivery_department = COALESCE(delivery_department, (SELECT department FROM customers WHERE customers.id = orders.customer_id)),
          delivery_province = COALESCE(delivery_province, (SELECT province FROM customers WHERE customers.id = orders.customer_id)),
          delivery_district = COALESCE(delivery_district, (SELECT district FROM customers WHERE customers.id = orders.customer_id)),
          delivery_reference = COALESCE(delivery_reference, (SELECT reference FROM customers WHERE customers.id = orders.customer_id))
      WHERE delivery_address IS NULL OR delivery_address = '' 
         OR delivery_department IS NULL OR delivery_department = ''
         OR delivery_province IS NULL OR delivery_province = ''
         OR delivery_district IS NULL OR delivery_district = ''
    `);
  } catch (e) {
    // Migration might fail if columns are missing or other issues
  }

try {
  db.exec("ALTER TABLE customer_addresses ADD COLUMN name TEXT");
} catch (e) {
  // Column likely already exists
}

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare('INSERT INTO products (name, description, price, cost, stock) VALUES (?, ?, ?, ?, ?)');
  insertProduct.run('Pote Manteca Artesanal 750 g', 'Manteca de cerdo 100% natural y artesanal', 85, 50, 100);

  const insertCustomer = db.prepare('INSERT INTO customers (type, document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  const checkCustomer = db.prepare('SELECT id FROM customers WHERE document_id = ?');

  const seedCustomers = [
    ['natural', '71234567', 'Juan', 'Pérez', null, 'juan.perez@email.com', '987654321', 'Lima', 'Lima', 'Miraflores', 'Av. Larco 745, Int. 402', 'A una cuadra del Parque Kennedy.'],
    ['natural', '76543210', 'María', 'Gómez', null, 'maria.gomez@email.com', '912345678', 'Lima', 'Lima', 'Los Olivos', 'Jr. Júpiter 1245, Urb. Sol de Oro', 'Cerca al cruce de la Av. Angélica Gamarra con Panamericana Norte.'],
    ['natural', '40123456', 'Roberto', 'Gómez', null, 'roberto.gomez@email.com', '955555555', 'Arequipa', 'Arequipa', 'Yanahuara', 'Calle Lima 210', 'A espaldas del Mirador de Yanahuara.'],
    ['empresa', '20123456781', 'Inversiones Surco SAC', null, 'Panadería Surco', 'contacto@panaderiasurco.pe', '01-444-1111', 'Lima', 'Lima', 'Santiago de Surco', 'Av. Manuel Olguín 335, Oficina 1201', 'Al costado del Centro Comercial Jockey Plaza.'],
    ['empresa', '20123456782', 'Distribuidora Magdalena EIRL', null, 'Pastelería Magdalena', 'ventas@pasteleriamagdalena.pe', '01-444-2222', 'Lima', 'Lima', 'Magdalena del Mar', 'Jr. José Granda 475', 'A dos cuadras del cruce con la Av. Javier Prado Oeste.']
  ];

  seedCustomers.forEach(c => {
    if (!checkCustomer.get(c[1])) {
      insertCustomer.run(...c);
    }
  });

  const insertAddress = db.prepare('INSERT INTO customer_addresses (customer_id, name, address, reference, department, province, district) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertAddress.run(1, 'Trabajo', 'Calle Las Orquídeas 580', 'Frente al centro empresarial Real.', 'Lima', 'Lima', 'San Isidro');
}

// Add 20 more default customers if they don't exist
const extraCustomersExist = db.prepare('SELECT id FROM customers WHERE name = ?').get('Juan Quispe');
if (!extraCustomersExist) {
  const insertCustomer = db.prepare('INSERT INTO customers (type, document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const checkCustomer = db.prepare('SELECT id FROM customers WHERE document_id = ?');

  const extraSeed = [
    // 14 Persona Natural (2 Province, 12 Lima)
    // Province
    ['natural', '10000001', 'Juan', 'Quispe', null, 'juan.quispe@email.com', '900000001', 'Cusco', 'Cusco', 'Santiago', 'Calle Nueva 123', 'Cerca a la plaza'],
    ['natural', '10000002', 'Maria', 'Huaman', null, 'maria.huaman@email.com', '900000002', 'Puno', 'Puno', 'Juliaca', 'Jr. Union 456', 'Frente al mercado'],
    
    // Lima
    ['natural', '10000003', 'Carlos', 'Sanchez', null, 'carlos.sanchez@email.com', '900000003', 'Lima', 'Lima', 'San Borja', 'Av. Aviacion 2345', 'Cerca a la estacion'],
    ['natural', '10000004', 'Ana', 'Torres', null, 'ana.torres@email.com', '900000004', 'Lima', 'Lima', 'La Molina', 'Calle Las Lomas 789', 'Urb. El El Sol'],
    ['natural', '10000005', 'Luis', 'Flores', null, 'luis.flores@email.com', '900000005', 'Lima', 'Lima', 'Surquillo', 'Jr. Dante 321', 'Cerca al mercado'],
    ['natural', '10000006', 'Elena', 'Castro', null, 'elena.castro@email.com', '900000006', 'Lima', 'Lima', 'San Miguel', 'Av. La Marina 1500', 'Frente a Plaza San Miguel'],
    ['natural', '10000007', 'Jorge', 'Ramirez', null, 'jorge.ramirez@email.com', '900000007', 'Lima', 'Lima', 'Pueblo Libre', 'Av. Brasil 2100', 'Cerca al Hospital Militar'],
    ['natural', '10000008', 'Sofia', 'Mendoza', null, 'sofia.mendoza@email.com', '900000008', 'Lima', 'Lima', 'Lince', 'Av. Arequipa 2500', 'Cerca a Risso'],
    ['natural', '10000009', 'Victor', 'Hugo', null, 'victor.hugo@email.com', '900000009', 'Lima', 'Lima', 'Barranco', 'Av. Grau 456', 'Cerca al Puente de los Suspiros'],
    ['natural', '10000010', 'Rosa', 'Diaz', null, 'rosa.diaz@email.com', '900000010', 'Lima', 'Lima', 'Chorrillos', 'Av. Huaylas 890', 'Cerca a la curva'],
    ['natural', '10000011', 'Pedro', 'Castillo', null, 'pedro.castillo@email.com', '900000011', 'Lima', 'Lima', 'Comas', 'Av. Tupac Amaru 1200', 'Km 11'],
    ['natural', '10000012', 'Julia', 'Rojas', null, 'julia.rojas@email.com', '900000012', 'Lima', 'Lima', 'San Juan de Lurigancho', 'Av. Proceres 345', 'Cerca a la estacion Piramides'],
    ['natural', '10000013', 'Manuel', 'Garcia', null, 'manuel.garcia@email.com', '900000013', 'Lima', 'Lima', 'Ate', 'Av. Central 678', 'Cerca a la municipalidad'],
    ['natural', '10000014', 'Carmen', 'Lopez', null, 'carmen.lopez@email.com', '900000014', 'Lima', 'Lima', 'Villa El Salvador', 'Av. Revolucion 123', 'Sector 3'],

    // 6 Empresa (2 Province, 4 Lima)
    // Province
    ['empresa', '20000000001', 'Agroindustrias del Norte', null, 'AgroNorte', 'contacto@agronorte.pe', '044-123456', 'La Libertad', 'Trujillo', 'Victor Larco Herrera', 'Av. Larco 500', 'Frente al mar'],
    ['empresa', '20000000002', 'Minera Los Andes', null, 'MineraAndes', 'info@mineraandes.pe', '063-654321', 'Pasco', 'Pasco', 'Chaupimarca', 'Calle Mineria 10', 'Zona industrial'],
    
    // Lima
    ['empresa', '20000000003', 'Tech Solutions Peru SAC', null, 'TechPeru', 'ventas@techperu.pe', '01-555-0001', 'Lima', 'Lima', 'San Isidro', 'Av. Rivera Navarrete 456', 'Oficina 501'],
    ['empresa', '20000000004', 'Logistica Express EIRL', null, 'LogiExpress', 'operaciones@logiexpress.pe', '01-555-0002', 'Lima', 'Lima', 'Callao', 'Av. Faucett 1200', 'Cerca al aeropuerto'],
    ['empresa', '20000000005', 'Consultoria Global S.A.', null, 'GlobalConsult', 'info@globalconsult.pe', '01-555-0003', 'Lima', 'Lima', 'Miraflores', 'Calle Alcanfores 789', 'Piso 10'],
    ['empresa', '20000000006', 'Alimentos del Peru SAC', null, 'AliPeru', 'contacto@aliperu.pe', '01-555-0004', 'Lima', 'Lima', 'Santa Anita', 'Av. Los Frutales 321', 'Cerca al mercado mayorista']
  ];

  extraSeed.forEach(c => {
    if (!checkCustomer.get(c[1])) {
      insertCustomer.run(...c);
    }
  });
}

// Seed 50 orders with specific distribution
const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
if (orderCount.count === 0) {
  const customers = db.prepare('SELECT * FROM customers').all() as any[];
  const addresses = db.prepare('SELECT * FROM customer_addresses').all() as any[];
  const products = db.prepare('SELECT * FROM products').all() as any[];

  if (products.length > 0 && customers.length > 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        customer_id, total_amount, status, created_at, 
        delivery_address, delivery_department, delivery_province, delivery_district, delivery_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

    // Helper to get random date in month
    const getRandomDateInMonth = (year: number, month: number) => {
      const date = new Date(year, month, Math.floor(Math.random() * 28) + 1);
      // If it's the current month (March 2026), don't go past today (March 18)
      if (year === 2026 && month === 2 && date.getDate() > 18) {
        date.setDate(Math.floor(Math.random() * 18) + 1);
      }
      return date.toISOString();
    };

    // Collect all unique delivery points (primary and secondary)
    const deliveryPoints: any[] = [];
    customers.forEach(c => {
      deliveryPoints.push({
        customer_id: c.id,
        address: c.address,
        department: c.department,
        province: c.province,
        district: c.district,
        reference: c.reference
      });
      const secondary = addresses.filter(a => a.customer_id === c.id);
      secondary.forEach(s => {
        deliveryPoints.push({
          customer_id: c.id,
          address: s.address,
          department: s.department,
          province: s.province,
          district: s.district,
          reference: s.reference
        });
      });
    });

    // Deterministic counts
    const allOrdersToCreate: any[] = [];
    // Jan: 20
    for (let i = 0; i < 20; i++) {
      allOrdersToCreate.push({ month: 0, status: i < 3 ? 'cancelled' : 'completed' });
    }
    // Feb: 18
    for (let i = 0; i < 18; i++) {
      allOrdersToCreate.push({ month: 1, status: i < 2 ? 'cancelled' : 'completed' });
    }
    // Mar: 12
    for (let i = 0; i < 12; i++) {
      let status = 'completed';
      if (i >= 6) {
        status = i < 9 ? 'pending' : 'shipped';
      }
      allOrdersToCreate.push({ month: 2, status });
    }

    // Shuffle orders
    for (let i = allOrdersToCreate.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOrdersToCreate[i], allOrdersToCreate[j]] = [allOrdersToCreate[j], allOrdersToCreate[i]];
    }

    // First, assign one to each delivery point
    deliveryPoints.forEach((dp, idx) => {
      if (idx >= 50) return;
      const orderSpec = allOrdersToCreate[idx];
      const date = getRandomDateInMonth(2026, orderSpec.month);
      const product = products[0];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const total = product.price * quantity;

      const info = insertOrder.run(
        dp.customer_id, total, orderSpec.status, date, 
        dp.address, dp.department, dp.province, dp.district, dp.reference
      );
      insertOrderItem.run(info.lastInsertRowid, product.id, quantity, product.price);
    });

    // Then assign the rest randomly
    for (let i = deliveryPoints.length; i < 50; i++) {
      const orderSpec = allOrdersToCreate[i];
      const dp = deliveryPoints[Math.floor(Math.random() * deliveryPoints.length)];
      const date = getRandomDateInMonth(2026, orderSpec.month);
      const product = products[0];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const total = product.price * quantity;

      const info = insertOrder.run(
        dp.customer_id, total, orderSpec.status, date, 
        dp.address, dp.department, dp.province, dp.district, dp.reference
      );
      insertOrderItem.run(info.lastInsertRowid, product.id, quantity, product.price);
    }
  }
}

const promoCount = db.prepare('SELECT COUNT(*) as count FROM promotions').get() as { count: number };
if (promoCount.count === 0) {
  const insertPromotion = db.prepare('INSERT INTO promotions (name, code, type, value, start_date, end_date, active) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertPromotion.run('Descuento de Bienvenida', 'BIENVENIDA10', 'percentage', 10, null, null, 1);
  insertPromotion.run('Cupón Fijo S/ 20', 'FIJO20', 'fixed', 20, null, null, 1);
  insertPromotion.run('Oferta Paga 2 Lleva 3', '3X2ARTESANAL', 'percentage', 33.33, null, null, 1);
  insertPromotion.run('Descuento verano 2026', 'VERANO2026', 'percentage', 20, '2026-01-01', '2026-04-30', 1);
}

// API Routes

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT id, username, name FROM users WHERE username = ? AND password = ?').get(username, password) as any;
  
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
});

// Dashboard Stats
app.get('/api/stats', (req, res) => {
  try {
    const range = req.query.range as string || '7days';
    const status = req.query.status as string || 'all';
    const customerType = req.query.customerType as string || 'all';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    let dateFilter = '';
    let limitDays = 7;
    if (range === 'custom' && startDate && endDate) {
      dateFilter = `AND date(o.created_at) BETWEEN date('${startDate}') AND date('${endDate}')`;
      const start = new Date(startDate);
      const end = new Date(endDate);
      limitDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    } else if (range === 'today') {
      dateFilter = "AND date(o.created_at) = date('now')";
      limitDays = 1;
    } else if (range === '7days') {
      dateFilter = "AND o.created_at >= date('now', '-7 days')";
      limitDays = 7;
    } else if (range === '30days') {
      dateFilter = "AND o.created_at >= date('now', '-30 days')";
      limitDays = 30;
    } else if (range === '90days') {
      dateFilter = "AND o.created_at >= date('now', '-90 days')";
      limitDays = 90;
    } else if (range === 'thisMonth') {
      dateFilter = "AND strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now')";
      limitDays = 31;
    } else if (range === 'thisYear') {
      dateFilter = "AND strftime('%Y', o.created_at) = strftime('%Y', 'now')";
      limitDays = 365;
    } else if (range === 'all') {
      dateFilter = "";
      limitDays = 365;
    }

    let statusFilter = '';
    let revenueStatusFilter = "AND o.status = 'completed'";
    if (status !== 'all') {
      statusFilter = `AND o.status = '${status}'`;
      revenueStatusFilter = `AND o.status = '${status}'`;
    }

    let customerTypeFilter = '';
    if (customerType !== 'all') {
      customerTypeFilter = `AND c.type = '${customerType}'`;
    }

    const combinedFilter = `${dateFilter} ${statusFilter} ${customerTypeFilter}`;

    const totalRevenue = db.prepare(`SELECT SUM(o.total_amount) as total FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}`).get() as { total: number | null };
    const totalDiscounts = db.prepare(`SELECT SUM(o.discount_amount) as total FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}`).get() as { total: number | null };
    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE 1=1 ${combinedFilter}`).get() as { count: number };
    const totalCustomers = db.prepare(`SELECT COUNT(DISTINCT o.customer_id) as count FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE 1=1 ${combinedFilter}`).get() as { count: number };
    
    const avgOrderValue = db.prepare(`SELECT AVG(o.total_amount) as avg FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}`).get() as { avg: number | null };
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock <= 20").get() as { count: number };
    const topProduct = db.prepare(`
      SELECT p.name, SUM(oi.quantity) as total_sold 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}
      GROUP BY p.id 
      ORDER BY total_sold DESC 
      LIMIT 1
    `).get() as { name: string, total_sold: number } | undefined;

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.id, c.name as customer_name, o.total_amount, o.status, o.created_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${combinedFilter}
      ORDER BY o.created_at DESC
      LIMIT 5
    `).all();

    // Sales by day for chart
    const salesDataQuery = `
      SELECT date(o.created_at) as date, SUM(o.total_amount) as amount, COUNT(o.id) as orderCount
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}
      GROUP BY date(o.created_at)
      ORDER BY date(o.created_at) DESC
      LIMIT ${limitDays}
    `;
    
    const salesData = db.prepare(salesDataQuery).all().reverse();

    // Sales by Customer Type
    const salesByCustomerType = db.prepare(`
      SELECT c.type as name, SUM(o.total_amount) as value
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${revenueStatusFilter} ${dateFilter}
      GROUP BY c.type
    `).all();

    // Revenue vs Cost
    const revenueVsCostQuery = `
      SELECT 
        date(o.created_at) as date, 
        SUM(oi.price * oi.quantity) as revenue, 
        SUM(p.cost * oi.quantity) as cost
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}
      GROUP BY date(o.created_at)
      ORDER BY date(o.created_at) DESC
      LIMIT ${limitDays}
    `;
    const revenueVsCost = db.prepare(revenueVsCostQuery).all().reverse();

    // Top Customers
    const topCustomers = db.prepare(`
      SELECT COALESCE(c.trade_name, c.name || ' ' || c.last_name) as name, SUM(o.total_amount) as value
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}
      GROUP BY c.id
      ORDER BY value DESC
      LIMIT 5
    `).all();

    // Sales by District
    const salesByDistrict = db.prepare(`
      SELECT COALESCE(c.district, 'Sin distrito') as name, SUM(o.total_amount) as value
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}
      GROUP BY c.district
      ORDER BY value DESC
      LIMIT 5
    `).all();

    // Top Products List
    const topProductsList = db.prepare(`
      SELECT p.name, SUM(oi.quantity) as value 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${revenueStatusFilter} ${dateFilter} ${customerTypeFilter}
      GROUP BY p.id 
      ORDER BY value DESC 
      LIMIT 5
    `).all();

    // Order Status Distribution
    const orderStatusDistribution = db.prepare(`
      SELECT o.status as name, COUNT(*) as value
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${dateFilter} ${customerTypeFilter}
      GROUP BY o.status
    `).all();

    res.json({
      revenue: totalRevenue.total || 0,
      discounts: totalDiscounts.total || 0,
      orders: totalOrders.count,
      customers: totalCustomers.count,
      avgOrderValue: avgOrderValue.avg || 0,
      lowStock: lowStock.count,
      topProduct: topProduct || { name: 'N/A', total_sold: 0 },
      recentOrders,
      salesData,
      salesByCustomerType,
      topProductsList,
      orderStatusDistribution,
      revenueVsCost,
      topCustomers,
      salesByDistrict
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Products
app.get('/api/products', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const search = req.query.search as string;
  
  let query = 'SELECT * FROM products';
  let countQuery = 'SELECT COUNT(*) as count FROM products';
  let params: any[] = [];
  let whereClauses: string[] = [];

  if (search) {
    whereClauses.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
    countQuery += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY id DESC';
  
  if (limit !== null) {
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }
  
  const products = db.prepare(query).all(...params);
  const total = db.prepare(countQuery).get(...params.slice(0, params.length - (limit !== null ? 2 : 0))) as { count: number };
  
  res.json({ items: products, total: total.count });
});

app.post('/api/products', (req, res) => {
  const { name, description, price, cost, stock } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO products (name, description, price, cost, stock) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, description, price, cost, stock);
    res.json({ id: info.lastInsertRowid, name, description, price, cost, stock });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', (req, res) => {
  const { name, description, price, cost, stock } = req.body;
  try {
    const stmt = db.prepare('UPDATE products SET name = ?, description = ?, price = ?, cost = ?, stock = ? WHERE id = ?');
    stmt.run(name, description, price, cost, stock, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Customers
app.get('/api/customers', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const search = req.query.search as string;
  const type = req.query.type as string;
  const department = req.query.department as string;
  const province = req.query.province as string;
  const district = req.query.district as string;
  
  let query = 'SELECT * FROM customers';
  let params: any[] = [];
  let whereClauses: string[] = [];

  if (search) {
    const searchParam = `%${search}%`;
    whereClauses.push(`(
      name LIKE ? OR 
      last_name LIKE ? OR 
      trade_name LIKE ? OR 
      document_id LIKE ? OR 
      email LIKE ? OR 
      phone LIKE ? OR 
      address LIKE ? OR
      EXISTS (SELECT 1 FROM customer_addresses ca WHERE ca.customer_id = customers.id AND ca.address LIKE ?)
    )`);
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  if (type) {
    whereClauses.push('type = ?');
    params.push(type);
  }

  if (department) {
    whereClauses.push('department = ?');
    params.push(department);
  }

  if (province) {
    whereClauses.push('province = ?');
    params.push(province);
  }

  if (district) {
    whereClauses.push('district = ?');
    params.push(district);
  }

  let countQuery = 'SELECT COUNT(*) as count FROM customers';
  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
    countQuery += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY id DESC';
  
  const countParams = [...params];

  if (limit !== null) {
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }
  
  const customers = db.prepare(query).all(...params);
  const total = db.prepare(countQuery).get(...countParams) as { count: number };
  
  res.json({ items: customers, total: total.count });
});

app.post('/api/customers', (req, res) => {
  const { type, document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO customers (type, document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(type || 'natural', document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference);
    res.json({ id: info.lastInsertRowid, type, document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', (req, res) => {
  const { type, document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference } = req.body;
  try {
    const stmt = db.prepare('UPDATE customers SET type = ?, document_id = ?, name = ?, last_name = ?, trade_name = ?, email = ?, phone = ?, department = ?, province = ?, district = ?, address = ?, reference = ? WHERE id = ?');
    stmt.run(type || 'natural', document_id, name, last_name, trade_name, email, phone, department, province, district, address, reference, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.put('/api/customers/:id/favorite-address', (req, res) => {
  const { addressId } = req.body;
  try {
    db.prepare('UPDATE customers SET favorite_address_id = ? WHERE id = ?').run(addressId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update favorite address' });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

app.get('/api/customers/:id/addresses', (req, res) => {
  try {
    const addresses = db.prepare('SELECT * FROM customer_addresses WHERE customer_id = ?').all(req.params.id);
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

app.post('/api/customers/:id/addresses', (req, res) => {
  const { name, address, reference, department, province, district } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO customer_addresses (customer_id, name, address, reference, department, province, district)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(req.params.id, name, address, reference, department, province, district);
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create address' });
  }
});

app.put('/api/customers/:id/addresses/:addressId', (req, res) => {
  const { name, address, reference, department, province, district } = req.body;
  try {
    db.prepare(`
      UPDATE customer_addresses 
      SET name = ?, address = ?, reference = ?, department = ?, province = ?, district = ?
      WHERE id = ? AND customer_id = ?
    `).run(name, address, reference, department, province, district, req.params.addressId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.delete('/api/customers/:id/addresses/:addressId', (req, res) => {
  try {
    db.prepare('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?').run(req.params.addressId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Orders
app.get('/api/orders', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let whereClauses = [];
  let params: any[] = [];

  if (search) {
    const searchParam = `%${search}%`;
    whereClauses.push(`(
      c.name LIKE ? OR 
      c.last_name LIKE ? OR 
      c.trade_name LIKE ? OR 
      c.document_id LIKE ? OR 
      c.phone LIKE ? OR
      o.id LIKE ? OR 
      o.status LIKE ? OR
      o.delivery_address LIKE ?
    )`);
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  if (status && status !== 'all') {
    whereClauses.push('o.status = ?');
    params.push(status);
  }

  if (startDate) {
    whereClauses.push('date(o.created_at) >= date(?)');
    params.push(startDate);
  }

  if (endDate) {
    whereClauses.push('date(o.created_at) <= date(?)');
    params.push(endDate);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ${whereClause}
  `).get(...params) as { count: number };
  
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, c.last_name as customer_last_name, p.name as promotion_name
    FROM orders o 
    LEFT JOIN customers c ON o.customer_id = c.id 
    LEFT JOIN promotions p ON o.promotion_id = p.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  
  res.json({
    data: orders,
    total: total.count,
    page,
    limit,
    totalPages: Math.ceil(total.count / limit)
  });
});

app.post('/api/orders', (req, res) => {
  const { customer_id, items, delivery_address, delivery_department, delivery_province, delivery_district, delivery_reference, new_address_to_save } = req.body; // items: [{ product_id, quantity, price }]
  
  const insertOrder = db.transaction((customerId, orderItems, deliveryAddr, deliveryDept, deliveryProv, deliveryDist, deliveryRef, newAddr) => {
    if (newAddr && newAddr.save) {
      let addressName = newAddr.name;
      if (!addressName) {
        const countRes = db.prepare('SELECT COUNT(*) as count FROM customer_addresses WHERE customer_id = ?').get(customerId) as { count: number };
        addressName = `Dirección ${countRes.count + 2}`;
      }
      const stmt = db.prepare('INSERT INTO customer_addresses (customer_id, name, address, reference, department, province, district) VALUES (?, ?, ?, ?, ?, ?, ?)');
      stmt.run(customerId, addressName, newAddr.address, newAddr.reference, newAddr.department, newAddr.province, newAddr.district);
    }

    let totalAmount = 0;
    for (const item of orderItems) {
      totalAmount += item.price * item.quantity;
    }

    let discountAmount = 0;
    let promotionId = req.body.promotion_id || null;

    if (promotionId) {
      const promo = db.prepare(`
        SELECT * FROM promotions 
        WHERE id = ? AND active = 1 
        AND (start_date IS NULL OR start_date <= datetime('now')) 
        AND (end_date IS NULL OR end_date >= datetime('now'))
      `).get(promotionId) as any;

      if (promo) {
        if (promo.type === 'percentage') {
          discountAmount = totalAmount * (promo.value / 100);
        } else {
          discountAmount = promo.value;
        }
      } else {
        promotionId = null;
      }
    }

    const finalTotal = Math.max(0, totalAmount - discountAmount);

    const stmt = db.prepare('INSERT INTO orders (customer_id, total_amount, status, created_at, delivery_address, delivery_department, delivery_province, delivery_district, delivery_reference, promotion_id, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(customerId, finalTotal, 'pending', new Date().toISOString(), deliveryAddr, deliveryDept, deliveryProv, deliveryDist, deliveryRef, promotionId, discountAmount);
    const orderId = info.lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of orderItems) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }
    
    return orderId;
  });

  try {
    const orderId = insertOrder(customer_id, items, delivery_address, delivery_department, delivery_province, delivery_district, delivery_reference, new_address_to_save);
    res.json({ success: true, orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  try {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.put('/api/orders/:id', (req, res) => {
  const { customer_id, items, delivery_address, delivery_department, delivery_province, delivery_district, delivery_reference, promotion_id } = req.body;
  const orderId = req.params.id;

  const updateOrderTransaction = db.transaction((customerId, orderItems, deliveryAddr, deliveryDept, deliveryProv, deliveryDist, deliveryRef, promoId) => {
    // 1. Restore stock for old items
    const oldItems = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId) as any[];
    const restoreStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of oldItems) {
      restoreStock.run(item.quantity, item.product_id);
    }

    // 2. Delete old items
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);

    // 3. Calculate new total and discounts
    let totalAmount = 0;
    for (const item of orderItems) {
      totalAmount += item.price * item.quantity;
    }

    let discountAmount = 0;
    let promotionId = promoId || null;

    if (promotionId) {
      const promo = db.prepare(`
        SELECT * FROM promotions 
        WHERE id = ? AND active = 1 
        AND (start_date IS NULL OR start_date <= datetime('now')) 
        AND (end_date IS NULL OR end_date >= datetime('now'))
      `).get(promotionId) as any;

      if (promo) {
        if (promo.type === 'percentage') {
          discountAmount = totalAmount * (promo.value / 100);
        } else {
          discountAmount = promo.value;
        }
      } else {
        promotionId = null;
      }
    }

    const finalTotal = Math.max(0, totalAmount - discountAmount);

    // 4. Update order record
    db.prepare(`
      UPDATE orders 
      SET customer_id = ?, total_amount = ?, delivery_address = ?, delivery_department = ?, delivery_province = ?, delivery_district = ?, delivery_reference = ?, promotion_id = ?, discount_amount = ?
      WHERE id = ?
    `).run(customerId, finalTotal, deliveryAddr, deliveryDept, deliveryProv, deliveryDist, deliveryRef, promotionId, discountAmount, orderId);

    // 5. Insert new items and update stock
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of orderItems) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }

    return true;
  });

  try {
    updateOrderTransaction(customer_id, items, delivery_address, delivery_department, delivery_province, delivery_district, delivery_reference, promotion_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

  app.get('/api/orders/:id', (req, res) => {
    try {
      const order = db.prepare(`
        SELECT o.id, o.id as order_id, o.total_amount, o.status, o.created_at, o.customer_id, 
               o.delivery_address, o.delivery_department, o.delivery_province, o.delivery_district, o.delivery_reference,
               o.discount_amount,
               c.type, c.document_id, c.name as customer_name, c.last_name, c.trade_name,
               c.email, c.phone,
               p.name as promotion_name, p.code as promotion_code
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        LEFT JOIN promotions p ON o.promotion_id = p.id
        WHERE o.id = ?
      `).get(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      const items = db.prepare(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `).all(req.params.id);
  
      res.json({ ...order, items });
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ 
        error: 'Failed to fetch order details',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

app.delete('/api/orders/:id', (req, res) => {
  const cancelOrder = db.transaction((orderId) => {
    // 1. Get current status
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId) as { status: string } | undefined;
    
    if (!order) return;

    // 2. If it wasn't already cancelled, restore stock
    if (order.status !== 'cancelled') {
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId) as any[];
      const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const item of items) {
        updateStock.run(item.quantity, item.product_id);
      }
    }
    
    // 3. Update status to cancelled
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(orderId);
  });

  try {
    cancelOrder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Promotions
app.get('/api/promotions', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  try {
    let whereClause = '';
    let params: any[] = [];

    if (search) {
      whereClause = ' WHERE name LIKE ? OR code LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM promotions ${whereClause}`).get(...params) as { count: number };
    const promotions = db.prepare(`SELECT * FROM promotions ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    
    res.json({
      data: promotions,
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

app.post('/api/promotions', (req, res) => {
  const { name, code, type, value, start_date, end_date, active } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO promotions (name, code, type, value, start_date, end_date, active) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, code, type, value, start_date, end_date, active ? 1 : 0);
    res.json({ id: info.lastInsertRowid, name, code, type, value, start_date, end_date, active });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

app.put('/api/promotions/:id', (req, res) => {
  const { name, code, type, value, start_date, end_date, active } = req.body;
  try {
    const stmt = db.prepare('UPDATE promotions SET name = ?, code = ?, type = ?, value = ?, start_date = ?, end_date = ?, active = ? WHERE id = ?');
    stmt.run(name, code, type, value, start_date, end_date, active ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

app.delete('/api/promotions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

app.get('/api/promotions/validate/:code', (req, res) => {
  try {
    const promo = db.prepare(`
      SELECT * FROM promotions 
      WHERE code = ? AND active = 1 
      AND (start_date IS NULL OR start_date <= datetime('now')) 
      AND (end_date IS NULL OR end_date >= datetime('now'))
    `).get(req.params.code) as any;
    
    if (promo) {
      res.json({ valid: true, promotion: promo });
    } else {
      res.json({ valid: false, message: 'Cupón inválido o expirado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate promotion' });
  }
});

// Start server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
