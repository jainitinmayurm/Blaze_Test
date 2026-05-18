require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

const initDb = async () => {
  try {
    console.log('Initializing database schema...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        capacity INT NOT NULL,
        equipment TEXT
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        agenda TEXT,
        type VARCHAR(50),
        room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE SET NULL,
        link TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'Scheduled'
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (meeting_id, user_id)
      );
    `);

    console.log('Tables created successfully.');

    // Seed data
    console.log('Checking for existing data before seeding...');
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    
    if (parseInt(usersCount.rows[0].count) === 0) {
      console.log('Database is empty. Seeding data from db.json...');
      const dbPath = path.join(__dirname, 'db.json');
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        for (const user of data.users || []) {
          await db.query(
            'INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, $4)',
            [user.id, user.name, user.email, user.role]
          );
        }

        for (const room of data.rooms || []) {
          await db.query(
            'INSERT INTO rooms (id, name, capacity, equipment) VALUES ($1, $2, $3, $4)',
            [room.id, room.name, room.capacity, room.equipment]
          );
        }

        for (const meeting of data.meetings || []) {
          await db.query(
            'INSERT INTO meetings (id, title, agenda, type, room_id, link, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [meeting.id, meeting.title, meeting.agenda, meeting.type, meeting.roomId || null, meeting.link || '', meeting.start, meeting.end, meeting.status || 'Scheduled']
          );

          if (meeting.participants && Array.isArray(meeting.participants)) {
            for (const userId of meeting.participants) {
              await db.query(
                'INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [meeting.id, userId]
              );
            }
          }
        }
        console.log('Database seeded successfully from db.json.');
      } else {
        console.log('db.json not found. No seed data applied.');
      }
    } else {
      console.log('Database already contains data. Skipping seed.');
    }

    console.log('Database initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDb();
