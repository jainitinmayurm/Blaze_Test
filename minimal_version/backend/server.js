const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// 1. Initialize Express application
const app = express();

// 2. Setup Middleware
// CORS allows our frontend (running on port 5174) to make requests to this backend (port 5001)
app.use(cors());
// express.json() automatically parses incoming JSON data in the request body
app.use(express.json());

// 3. Database setup
// We are using a simple db.json file instead of a full database like PostgreSQL to keep things minimal
const dbPath = path.join(__dirname, 'db.json');

// Helper function to read data from our JSON 'database'
const readDB = () => {
  // Read the file synchronously and parse it into a JavaScript object
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

// Helper function to write data back to our JSON 'database'
const writeDB = (data) => {
  // Convert the JavaScript object back to a JSON string with formatting (2 spaces) and save it
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// --- API ROUTES ---

// GET /api/users: Fetch all users
app.get('/api/users', (req, res) => {
  const db = readDB(); // Read current state
  res.json(db.users);  // Send the users array as a JSON response
});

// GET /api/rooms: Fetch all meeting rooms
app.get('/api/rooms', (req, res) => {
  const db = readDB();
  res.json(db.rooms);
});

// POST /api/rooms: Create a new meeting room
app.post('/api/rooms', (req, res) => {
  const db = readDB();
  // Create a new room object, generating a simple unique ID using the current timestamp
  const newRoom = { id: Date.now().toString(), ...req.body };
  db.rooms.push(newRoom); // Add to our array
  writeDB(db); // Save to the file
  res.json(newRoom); // Return the newly created room
});

// GET /api/meetings: Fetch all meetings
app.get('/api/meetings', (req, res) => {
  const db = readDB();
  res.json(db.meetings);
});

// POST /api/meetings: Create a new meeting
app.post('/api/meetings', (req, res) => {
  const db = readDB();
  // Create a new meeting object with a default 'Scheduled' status
  const newMeeting = { id: Date.now().toString(), status: 'Scheduled', ...req.body };
  db.meetings.push(newMeeting);
  writeDB(db);
  res.json(newMeeting);
});

// PUT /api/meetings/:id: Update an existing meeting (e.g., to cancel it)
app.put('/api/meetings/:id', (req, res) => {
  const db = readDB();
  // Find the index of the meeting we want to update
  const index = db.meetings.findIndex(m => m.id === req.params.id);
  
  if (index !== -1) {
    // Merge the existing meeting data with the new data from the request body
    db.meetings[index] = { ...db.meetings[index], ...req.body };
    writeDB(db); // Save changes
    res.json(db.meetings[index]); // Return updated meeting
  } else {
    // If we didn't find the meeting, return a 404 Not Found error
    res.status(404).json({ error: 'Not found' });
  }
});

// GET /api/reports: Fetch aggregated statistics for the dashboard
app.get('/api/reports', (req, res) => {
  const db = readDB();
  // Calculate basic statistics from our arrays
  const totalMeetings = db.meetings.length;
  const totalRooms = db.rooms.length;
  const cancelled = db.meetings.filter(m => m.status === 'Cancelled').length;
  
  res.json({ totalMeetings, totalRooms, cancelled });
});

// 4. Start the server
const PORT = 5001;
app.listen(PORT, () => console.log(`Minimal backend running on http://localhost:${PORT}`));
