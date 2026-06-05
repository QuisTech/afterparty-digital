require('dotenv').config();

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI
  || 'mongodb+srv://michquis_db_user:eDzC2nVlElZjAEHj@afterpartycluster.3snvrrx.mongodb.net/afterparty?appName=AfterpartyCluster';

// Allowed frontend origins — add any domains that should access this API
const ALLOWED_ORIGINS = [
  'https://afterparty-digital.vercel.app',
  'https://d1mjg93qeqleyh.cloudfront.net',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

// ---------------------------------------------------------------------------
// App & Server
// ---------------------------------------------------------------------------
const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Health Check  (used by load balancers, monitoring, uptime checks)
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
console.log('📡 Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------
const userSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  gems: { type: Number, default: 0 },
});

const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// ---------------------------------------------------------------------------
// Socket.io Events
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`🟢 Client connected  [${socket.id}]`);

  socket.on('join', async (username) => {
    socket.username = username;
    await User.findOneAndUpdate(
      { name: username },
      { name: username },
      { upsert: true }
    );

    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    socket.emit('chat history', messages.reverse());

    const users = await User.find().select('name gems');
    io.emit('users update', users);
    io.emit('system message', `✨ ${username} joined! ✨`);
  });

  socket.on('chat message', async (data) => {
    await Message.create({ username: socket.username, message: data.message });
    io.emit('chat message', { username: socket.username, message: data.message });
  });

  socket.on('mine gem', async () => {
    const user = await User.findOne({ name: socket.username });
    if (user) {
      user.gems += 1;
      await user.save();
      io.emit('gem update', { username: socket.username, gems: user.gems });
      const users = await User.find().select('name gems');
      io.emit('users update', users);
    }
  });

  socket.on('spend gems', async (data) => {
    const user = await User.findOne({ name: socket.username });
    if (user && user.gems >= data.amount) {
      user.gems -= data.amount;
      await user.save();
      io.emit('gem update', { username: socket.username, gems: user.gems });
      const users = await User.find().select('name gems');
      io.emit('users update', users);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected [${socket.id}]`);
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server listening on port ${PORT}`);
  console.log(`💎 MongoDB: ${mongoose.connection.readyState === 1 ? 'CONNECTED' : 'CONNECTING...'}\n`);
});

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------
const shutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received — shutting down gracefully...`);
  server.close(() => console.log('🛑 HTTP server closed.'));
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed.');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
