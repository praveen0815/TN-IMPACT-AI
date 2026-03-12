import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('sentinel.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat REAL,
    lng REAL,
    reliability_score INTEGER,
    lead_time INTEGER,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    severity TEXT,
    location TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    supplier_id INTEGER,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT,
    stock_level INTEGER,
    safety_stock INTEGER,
    warehouse_location TEXT
  );
`);

// Migration: Ensure columns exist if tables were created by an older version
const tableInfo = (name: string) => db.prepare(`PRAGMA table_info(${name})`).all() as any[];

const alertsCols = tableInfo('alerts');
if (!alertsCols.some(c => c.name === 'supplier_id')) {
  db.exec('ALTER TABLE alerts ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id)');
}

const suppliersCols = tableInfo('suppliers');
if (!suppliersCols.some(c => c.name === 'lat')) {
  db.exec('ALTER TABLE suppliers ADD COLUMN lat REAL');
}
if (!suppliersCols.some(c => c.name === 'lng')) {
  db.exec('ALTER TABLE suppliers ADD COLUMN lng REAL');
}

const inventoryCols = tableInfo('inventory');
if (!inventoryCols.some(c => c.name === 'stock_level')) {
  // If we had an old schema with 'quantity' instead of 'stock_level'
  if (inventoryCols.some(c => c.name === 'quantity')) {
    db.exec('ALTER TABLE inventory RENAME COLUMN quantity TO stock_level');
  } else {
    db.exec('ALTER TABLE inventory ADD COLUMN stock_level INTEGER');
  }
}
if (!inventoryCols.some(c => c.name === 'safety_stock')) {
  if (inventoryCols.some(c => c.name === 'min_stock')) {
    db.exec('ALTER TABLE inventory RENAME COLUMN min_stock TO safety_stock');
  } else {
    db.exec('ALTER TABLE inventory ADD COLUMN safety_stock INTEGER');
  }
}
if (!inventoryCols.some(c => c.name === 'product_name')) {
  if (inventoryCols.some(c => c.name === 'item_name')) {
    db.exec('ALTER TABLE inventory RENAME COLUMN item_name TO product_name');
  } else {
    db.exec('ALTER TABLE inventory ADD COLUMN product_name TEXT');
  }
}

// Seed initial data if empty
const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };
if (supplierCount.count === 0) {
  const insertSupplier = db.prepare('INSERT INTO suppliers (name, location, lat, lng, reliability_score, lead_time, category) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertSupplier.run('Shenzhen Electronics Ltd', 'Shenzhen, China', 22.5431, 114.0579, 85, 14, 'Electronics');
  insertSupplier.run('Thai Rubber Corp', 'Bangkok, Thailand', 13.7563, 100.5018, 78, 21, 'Raw Materials');
  insertSupplier.run('German Precision Parts', 'Hamburg, Germany', 53.5511, 9.9937, 95, 7, 'Mechanical');
  insertSupplier.run('Vietnam Logistics Hub', 'Ho Chi Minh City, Vietnam', 10.8231, 106.6297, 82, 12, 'Logistics');
  insertSupplier.run('US Tech Components', 'Austin, USA', 30.2672, -97.7431, 92, 5, 'Electronics');

  const insertInventory = db.prepare('INSERT INTO inventory (product_name, stock_level, safety_stock, warehouse_location) VALUES (?, ?, ?, ?)');
  insertInventory.run('Microchips X1', 5000, 1200, 'Singapore');
  insertInventory.run('Rubber Gaskets', 2000, 2500, 'Rotterdam'); // Low stock alert
  insertInventory.run('Steel Bearings', 8000, 3000, 'Chicago');
}

interface Supplier {
  id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  reliability_score: number;
  lead_time: number;
  category: string;
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  io.on('connection', (socket) => {
    console.log('Client connected to disruption feed:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected from feed');
    });
  });

  // API Routes
  app.get('/api/suppliers', (req, res) => {
    const suppliers = db.prepare('SELECT * FROM suppliers').all();
    res.json(suppliers);
  });

  app.get('/api/alerts', (req, res) => {
    const alerts = db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 50').all();
    res.json(alerts);
  });

  app.get('/api/inventory', (req, res) => {
    const inventory = db.prepare('SELECT * FROM inventory').all();
    res.json(inventory);
  });

  app.get('/api/dashboard/metrics', (req, res) => {
    const totalSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };
    const activeAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE timestamp > datetime('now', '-24 hours')").get() as { count: number };
    const avgRisk = 42; // Calculated dynamically in a real app
    res.json({
      totalSuppliers: totalSuppliers.count,
      activeAlerts: activeAlerts.count,
      avgRiskScore: avgRisk,
      inventoryHealth: 'Stable'
    });
  });

  // Simulation Endpoint
  app.post('/api/simulations/run', (req, res) => {
    const { scenario, baseDelay, baseImpact } = req.body;
    // In a real app, this would call the simulation service
    // For now, we'll return a calculated result
    const iterations = 10000;
    const stockoutProb = Math.random() * 40 + 10;
    res.json({
      scenario,
      stockoutProbability: stockoutProb,
      expectedDelay: baseDelay * 1.4,
      financialImpact: baseImpact * 1.2,
      recoveryTime: baseDelay * 3,
      iterations
    });
  });

  // 1. Disruption Monitoring Agent
  const runMonitoringAgent = async () => {
    console.log('Monitoring Agent: Checking real-world disruption signals...');
    
    const newsKey = process.env.NEWS_API_KEY;
    const weatherKey = process.env.OPENWEATHER_API_KEY;

    if (!newsKey || !weatherKey) {
      return runSimulatedMonitoring();
    }

    try {
      // Fetch News
      const newsResponse = await fetch(`https://newsapi.org/v2/everything?q="supply chain" AND (disruption OR strike OR port OR shortage)&sortBy=publishedAt&pageSize=3&apiKey=${newsKey}`);
      const newsData = await newsResponse.json() as any;

      if (newsData.articles) {
        for (const article of newsData.articles) {
          const exists = db.prepare('SELECT id FROM alerts WHERE description = ?').get(article.description);
          if (!exists) {
            const alert = {
              type: 'News Signal',
              severity: article.title.toLowerCase().includes('critical') || article.title.toLowerCase().includes('shutdown') ? 'Critical' : 'High',
              location: 'Global',
              description: article.title,
              timestamp: new Date(article.publishedAt).toISOString()
            };
            saveAndBroadcastAlert(alert);
            updateSupplierReliability(alert);
          }
        }
      }

      // Fetch Weather
      const suppliers = db.prepare('SELECT * FROM suppliers').all() as Supplier[];
      for (const supplier of suppliers) {
        if (supplier.lat && supplier.lng) {
          const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${supplier.lat}&lon=${supplier.lng}&appid=${weatherKey}`);
          const weather = await weatherRes.json() as any;
          
          if (weather.weather && (weather.weather[0].main === 'Thunderstorm' || weather.wind?.speed > 15)) {
            const alert = {
              type: 'Weather Event',
              severity: weather.wind?.speed > 25 ? 'Critical' : 'Medium',
              location: supplier.location,
              description: `Severe ${weather.weather[0].main} near ${supplier.name}.`,
              timestamp: new Date().toISOString(),
              supplier_id: supplier.id
            };
            saveAndBroadcastAlert(alert);
            updateSupplierReliability(alert);
          }
        }
      }
    } catch (error) {
      console.error('Monitoring Agent Error:', error);
    }
  };

  // 2. Inventory Fluctuation Agent (Simulates real-time stock consumption/restock)
  const runInventoryAgent = () => {
    console.log('Inventory Agent: Updating stock levels...');
    try {
      const items = db.prepare('SELECT * FROM inventory').all() as any[];
      const randomItem = items[Math.floor(Math.random() * items.length)];
      
      // Simulate consumption or restock
      const change = Math.floor(Math.random() * 200) - 100; // -100 to +100
      const newLevel = Math.max(0, randomItem.stock_level + change);
      
      db.prepare('UPDATE inventory SET stock_level = ? WHERE id = ?').run(newLevel, randomItem.id);
      
      const updatedItem = { ...randomItem, stock_level: newLevel };
      io.emit('inventory_update', updatedItem);
      broadcastMetrics();
      
      if (newLevel < randomItem.safety_stock) {
        saveAndBroadcastAlert({
          type: 'Low Stock Alert',
          severity: 'High',
          location: randomItem.warehouse_location,
          description: `Inventory for ${randomItem.product_name} dropped below threshold.`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Inventory Agent Error:', error);
    }
  };

  // 3. Supplier Reliability Agent (Adjusts scores based on recent alerts)
  const updateSupplierReliability = (alert: any) => {
    if (!alert.supplier_id) return;
    
    try {
      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(alert.supplier_id) as Supplier;
      if (supplier) {
        const penalty = alert.severity === 'Critical' ? 5 : alert.severity === 'High' ? 3 : 1;
        const newScore = Math.max(0, supplier.reliability_score - penalty);
        
        db.prepare('UPDATE suppliers SET reliability_score = ? WHERE id = ?').run(newScore, supplier.id);
        io.emit('supplier_update', { ...supplier, reliability_score: newScore });
      }
    } catch (error) {
      console.error('Supplier Agent Error:', error);
    }
  };

  const broadcastMetrics = () => {
    try {
      const totalSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as any;
      const activeAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE timestamp > datetime('now', '-24 hours')").get() as any;
      const avgRiskScore = db.prepare('SELECT AVG(reliability_score) as avg FROM suppliers').get() as any;
      const lowStockItems = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE stock_level < safety_stock').get() as any;
      
      const metrics = {
        totalSuppliers: totalSuppliers.count,
        activeAlerts: activeAlerts.count,
        avgRiskScore: Math.round(100 - (avgRiskScore.avg || 0)),
        inventoryHealth: lowStockItems.count === 0 ? 'Excellent' : lowStockItems.count < 3 ? 'Good' : 'Critical'
      };
      
      io.emit('metrics_update', metrics);
    } catch (error) {
      console.error('Metrics Broadcast Error:', error);
    }
  };

  const saveAndBroadcastAlert = (alert: any) => {
    const insertAlert = db.prepare('INSERT INTO alerts (type, severity, location, description, timestamp, supplier_id) VALUES (?, ?, ?, ?, ?, ?)');
    const result = insertAlert.run(alert.type, alert.severity, alert.location, alert.description, alert.timestamp, alert.supplier_id || null);
    
    const newAlert = {
      id: result.lastInsertRowid,
      ...alert
    };
    io.emit('new_alert', newAlert);
    broadcastMetrics();
  };

  const runSimulatedMonitoring = () => {
    const disruptionTypes = [
      { type: 'Port Congestion', severity: 'High', description: 'Increased vessel wait times detected.' },
      { type: 'Labor Strike', severity: 'Critical', description: 'Industrial action affecting output.' }
    ];
    const locations = ['Shanghai, China', 'Hamburg, Germany', 'Singapore'];
    const disruption = disruptionTypes[Math.floor(Math.random() * disruptionTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    saveAndBroadcastAlert({
      type: disruption.type,
      severity: disruption.severity,
      location: location,
      description: disruption.description,
      timestamp: new Date().toISOString()
    });
  };

  // Agent Schedules
  setInterval(runMonitoringAgent, 10 * 60 * 1000); // 10 mins
  setInterval(runInventoryAgent, 15 * 1000);      // 15 seconds for "real time" feel
  
  // Initial runs
  setTimeout(runMonitoringAgent, 5000);
  setTimeout(runInventoryAgent, 8000);
  setTimeout(broadcastMetrics, 2000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SentinelChain AI server running at http://localhost:${PORT}`);
  });
}

startServer();
