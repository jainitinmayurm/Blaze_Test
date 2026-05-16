require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./config/db');
const { startReminderService } = require('./services/reminder.service');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// ─── Routes ───
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/meetings', require('./routes/meeting.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/availability', require('./routes/availability.routes'));
app.use('/api/calendar', require('./routes/calendar.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// ─── Health check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Migration Runner ───
async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\n📦 Running ${files.length} migration(s)...`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      await pool.query(sql);
      console.log(`  ✅ ${file}`);
    } catch (err) {
      // Ignore duplicate errors for idempotent migrations
      if (err.code === '42710' || err.code === '23505') {
        console.log(`  ⏭️  ${file} (already applied)`);
      } else {
        console.error(`  ❌ ${file}: ${err.message}`);
        throw err;
      }
    }
  }
  console.log('📦 Migrations complete.\n');
}

// ─── Seed Password Fix ───
// The seed data uses a placeholder hash. On first run, replace it with real bcrypt hashes.
async function fixSeedPasswords() {
  const bcrypt = require('bcryptjs');
  const placeholderHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

  const { rows } = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE password_hash = $1',
    [placeholderHash]
  );

  if (rows.length > 0) {
    console.log('🔑 Fixing seed user passwords...');
    for (const user of rows) {
      // Admin gets Admin@123, others get User@123
      const password = user.email === 'admin@blaze.com' ? 'Admin@123' : 'User@123';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
      console.log(`  🔑 ${user.email} password set`);
    }
  }
}

// ─── Start Server ───
async function start() {
  try {
    // Test DB connection
    await pool.query('SELECT NOW()');
    console.log('🗄️  PostgreSQL connected');

    // Run migrations
    await runMigrations();

    // Fix seed passwords on first run
    await fixSeedPasswords();

    // Start reminder service
    startReminderService();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
