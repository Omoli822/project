const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const OpenAI = require('openai');
const path = require('path');

// Enhanced error logging
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Load environment variables
dotenv.config();

const app = express();

// Improved configuration loading
function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('Fatal: Cannot load configuration', error);
    process.exit(1);
  }
}

const config = loadConfig();

const PORT = process.env.PORT || config.port || 3000;

// Enhanced database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'test',
  connectionLimit: 10,
  connectTimeout: 5000,
  waitForConnections: true,
  queueLimit: 0
});

// Comprehensive database initialization
async function initializeDatabaseTables() {
  const connection = await pool.getConnection();
  try {
    // Create tables with more robust schema
    await connection.query(`
      CREATE TABLE IF NOT EXISTS openai_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        api_key VARCHAR(255),
        model VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_input TEXT,
        ai_response TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        session_id VARCHAR(100)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    connection.release();
  }
}

// Improved OpenAI Integration
let openai = null;
function initializeOpenAI() {
  if (config.openaiIntegration === 'yes' && process.env.OPENAI_API_KEY) {
    try {
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } catch (error) {
      console.error('OpenAI initialization failed:', error);
      return null;
    }
  }
  return null;
}
openai = initializeOpenAI();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Comprehensive Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced Chat API
app.post('/api/chat', async (req, res) => {
  if (!openai) {
    return res.status(400).json({ error: 'AI service not configured' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: config.openaiModel || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    });

    const aiResponse = chatCompletion.choices[0].message.content;

    // Log conversation
    await pool.query(
      'INSERT INTO conversation_logs (user_input, ai_response, ip_address) VALUES (?, ?, ?)',
      [message, aiResponse, req.ip]
    );

    res.json({ reply: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    await pool.getConnection();
    
    res.json({ 
      status: 'ok', 
      company: config.companyName,
      businessType: config.businessType,
      online: config.online,
      openaiIntegration: config.openaiIntegration
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDatabaseTables();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`OpenAI Integration: ${config.openaiIntegration}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);