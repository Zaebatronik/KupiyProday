const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        nickname VARCHAR(100) NOT NULL,
        country VARCHAR(10),
        city VARCHAR(100),
        radius INTEGER,
        language VARCHAR(10),
        contacts JSONB DEFAULT '{}',
        banned BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        registration_date TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR(50) PRIMARY KEY,
        serial_number VARCHAR(50),
        user_id VARCHAR(50) REFERENCES users(id),
        user_nickname VARCHAR(100),
        category VARCHAR(50),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2),
        negotiable BOOLEAN DEFAULT false,
        city VARCHAR(100),
        country VARCHAR(10),
        photos TEXT[],
        status VARCHAR(20) DEFAULT 'active',
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(50) PRIMARY KEY,
        listing_id VARCHAR(50) REFERENCES listings(id),
        buyer_id VARCHAR(50) REFERENCES users(id),
        seller_id VARCHAR(50) REFERENCES users(id),
        last_message TEXT,
        last_message_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// === USERS ENDPOINTS ===

// Get all users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Register new user
app.post('/users', async (req, res) => {
  try {
    const { id, nickname, country, city, radius, language, contacts, registrationDate } = req.body;
    
    console.log('📝 Registering user:', { id, nickname, city });
    
    const result = await pool.query(
      `INSERT INTO users (id, nickname, country, city, radius, language, contacts, registration_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         nickname = $2, country = $3, city = $4, radius = $5, language = $6
       RETURNING *`,
      [id, nickname, country, city, radius, language, JSON.stringify(contacts), registrationDate || new Date()]
    );
    
    console.log('✅ User registered:', result.rows[0].nickname);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { banned, ...updates } = req.body;
    
    let query = 'UPDATE users SET ';
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach((key, index) => {
      query += `${key} = $${paramCount}`;
      values.push(updates[key]);
      paramCount++;
      if (index < Object.keys(updates).length - 1) query += ', ';
    });
    
    if (banned !== undefined) {
      if (values.length > 0) query += ', ';
      query += `banned = $${paramCount}`;
      values.push(banned);
      paramCount++;
    }
    
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ User ${id} updated${banned !== undefined ? ` (banned: ${banned})` : ''}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// === LISTINGS ENDPOINTS ===

// Get all listings
app.get('/listings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM listings WHERE status = $1 ORDER BY created_at DESC', ['active']);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get listing by ID
app.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create listing
app.post('/listings', async (req, res) => {
  try {
    const {
      id,
      serialNumber, serial_number,
      userId, user_id,
      userNickname, user_nickname,
      category, title, description, price, negotiable,
      city, country, photos, status, views
    } = req.body;
    
    // Поддержка и camelCase и snake_case
    const finalSerialNumber = serialNumber || serial_number || `SN${Date.now()}`;
    const finalUserId = userId || user_id;
    const finalUserNickname = userNickname || user_nickname;
    
    console.log('📦 Creating listing:', { 
      title, 
      userId: finalUserId, 
      userNickname: finalUserNickname 
    });
    
    const result = await pool.query(
      `INSERT INTO listings (
        id, serial_number, user_id, user_nickname, category,
        title, description, price, negotiable, city, country,
        photos, status, views
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        id || `listing_${Date.now()}`,
        finalSerialNumber,
        finalUserId,
        finalUserNickname,
        category,
        title,
        description,
        price,
        negotiable || false,
        city,
        country,
        Array.isArray(photos) ? photos : [],
        status || 'active',
        views || 0
      ]
    );
    
    console.log('✅ Listing created:', result.rows[0].title);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating listing:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create listing', details: error.message });
  }
});

// Update listing
app.put('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    let query = 'UPDATE listings SET updated_at = NOW()';
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      query += `, ${key} = $${paramCount}`;
      values.push(updates[key]);
      paramCount++;
    });
    
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Delete listing
app.delete('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE listings SET status = $1 WHERE id = $2', ['deleted', id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// === CHATS ENDPOINTS ===

app.get('/chats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chats ORDER BY last_message_time DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🐻 Берлога Marketplace API',
    version: '1.0.0',
    endpoints: {
      users: '/users',
      listings: '/listings',
      chats: '/chats',
      health: '/health'
    }
  });
});

// Start server
async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  });
}

start().catch(console.error);
