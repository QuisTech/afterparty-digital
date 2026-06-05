const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Schema
const attendeeSchema = new mongoose.Schema({
  name: String,
  gems: { type: Number, default: 0 },
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendee' }],
  joinedAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Attendee = mongoose.model('Attendee', attendeeSchema);
const Message = mongoose.model('Message', messageSchema);

// Socket.io real-time events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', async (username) => {
    socket.username = username;
    
    // Find or create user
    let user = await Attendee.findOne({ name: username });
    if (!user) {
      user = new Attendee({ name: username });
      await user.save();
    }
    
    // Send recent messages
    const recentMessages = await Message.find().sort({ timestamp: -1 }).limit(50);
    socket.emit('chat history', recentMessages.reverse());
    
    // Send online users
    const users = await Attendee.find();
    io.emit('users update', users.map(u => ({ name: u.name, gems: u.gems })));
    
    io.emit('system message', `${username} joined the cavern!`);
  });
  
  socket.on('chat message', async (data) => {
    const message = new Message({
      username: socket.username,
      message: data.message
    });
    await message.save();
    io.emit('chat message', {
      username: socket.username,
      message: data.message,
      timestamp: message.timestamp
    });
  });
  
  socket.on('mine gem', async () => {
    const user = await Attendee.findOne({ name: socket.username });
    if (user) {
      user.gems += 1;
      await user.save();
      io.emit('gem update', { username: socket.username, gems: user.gems });
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('system message', `${socket.username} left the cavern.`);
    }
  });
});

// API Routes
app.get('/api/attendees', async (req, res) => {
  const attendees = await Attendee.find().sort({ gems: -1 });
  res.json(attendees);
});

app.post('/api/checkin', async (req, res) => {
  const { name } = req.body;
  const attendee = new Attendee({ name });
  await attendee.save();
  io.emit('new attendee', attendee);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
