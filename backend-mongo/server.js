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

// Allowed frontend origins
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
// Health Check
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

const cavernSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  launchTime: String,
  capacity: { type: Number, default: 100 },
  activeCount: { type: Number, default: 0 },
});

const teamSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  looking: String,
  tech: String,
  membersCount: { type: Number, default: 1 },
});

const photoSchema = new mongoose.Schema({
  url: String,
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Cavern = mongoose.model('Cavern', cavernSchema);
const Team = mongoose.model('Team', teamSchema);
const Photo = mongoose.model('Photo', photoSchema);

// ---------------------------------------------------------------------------
// Database Seeder (Ensures no blank views / holds default structures)
// ---------------------------------------------------------------------------
async function seedDatabase() {
  try {
    // 1. Seed Simulated Developers
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial developers...');
      const seedUsers = [
        { name: 'Michquis', gems: 120 },
        { name: 'QuantumMiner', gems: 85 },
        { name: 'AetherCavern', gems: 64 },
        { name: 'CyberGoose', gems: 42 },
        { name: 'NovaDesigner', gems: 38 },
        { name: 'PixelArtisan', gems: 29 },
        { name: 'RustCoder', gems: 24 },
        { name: 'DevopsSage', gems: 15 }
      ];
      await User.insertMany(seedUsers);
      console.log('✅ Initial developers seeded!');
    }

    // 2. Seed Caverns
    const cavernCount = await Cavern.countDocuments();
    if (cavernCount === 0) {
      console.log('🌱 Seeding initial caverns...');
      const seedCaverns = [
        { name: 'Midnight Hackers Cavern', launchTime: 'Active Now', capacity: 100, activeCount: 47 },
        { name: 'Night crawlers', launchTime: 'Tonight 10 pm', capacity: 100, activeCount: 0 }
      ];
      await Cavern.insertMany(seedCaverns);
      console.log('✅ Caverns seeded!');
    }

    // 3. Seed Teams
    const teamCount = await Team.countDocuments();
    if (teamCount === 0) {
      console.log('🌱 Seeding initial teams...');
      const seedTeams = [
        { name: 'Amethyst AI Guild', looking: 'AI Engineer', tech: 'Python, PyTorch', membersCount: 3 },
        { name: 'Glider Designers', looking: 'UX Designer', tech: 'Figma, Tailwind', membersCount: 2 },
        { name: 'Rust Cavernites', looking: 'Full Stack Dev', tech: 'Rust, Node.js', membersCount: 1 }
      ];
      await Team.insertMany(seedTeams);
      console.log('✅ Teams seeded!');
    }

    // 4. Seed Photos
    const photoCount = await Photo.countDocuments();
    if (photoCount === 0) {
      console.log('🌱 Seeding initial photos...');
      const seedPhotos = [
        { url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop', likes: 12 },
        { url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop', likes: 8 },
        { url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop', likes: 24 }
      ];
      await Photo.insertMany(seedPhotos);
      console.log('✅ Photos seeded!');
    }
  } catch (err) {
    console.error('❌ Database seed error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Database Connect
// ---------------------------------------------------------------------------
console.log('📡 Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected!');
    await seedDatabase();
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ---------------------------------------------------------------------------
// Socket.io Events
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`🟢 Client connected [${socket.id}]`);

  socket.on('join', async (username) => {
    socket.username = username;
    
    // Register or fetch user
    await User.findOneAndUpdate(
      { name: username },
      { name: username },
      { upsert: true }
    );

    // 1. Send chat history
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    socket.emit('chat history', messages.reverse());

    // 2. Send active users list
    const users = await User.find().select('name gems');
    io.emit('users update', users);

    // 3. Send active caverns
    const caverns = await Cavern.find();
    socket.emit('caverns update', caverns);

    // 4. Send forged teams
    const teams = await Team.find();
    socket.emit('teams update', teams);

    // 5. Send photo wall
    const photos = await Photo.find().sort({ timestamp: -1 });
    socket.emit('photos update', photos);

    io.emit('system message', `✨ ${username} joined! ✨`);
  });

  // Chat message handler
  socket.on('chat message', async (data) => {
    await Message.create({ username: socket.username, message: data.message });
    io.emit('chat message', { username: socket.username, message: data.message });
  });

  // Gem mining handler
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

  // Spend gems handler
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

  // Create Cavern Event handler
  socket.on('create cavern', async (data) => {
    try {
      await Cavern.findOneAndUpdate(
        { name: data.name },
        { name: data.name, launchTime: data.launchTime, capacity: data.capacity, activeCount: 0 },
        { upsert: true }
      );
      const caverns = await Cavern.find();
      io.emit('caverns update', caverns);
    } catch (err) {
      console.error('Create Cavern error:', err.message);
    }
  });

  // Create Team Alliance handler
  socket.on('create team', async (data) => {
    try {
      await Team.findOneAndUpdate(
        { name: data.name },
        { name: data.name, looking: data.looking, tech: data.tech, membersCount: 1 },
        { upsert: true }
      );
      const teams = await Team.find();
      io.emit('teams update', teams);
    } catch (err) {
      console.error('Create Team error:', err.message);
    }
  });

  // Post photo handler
  socket.on('post photo', async (data) => {
    try {
      await Photo.create({ url: data.url });
      const photos = await Photo.find().sort({ timestamp: -1 });
      io.emit('photos update', photos);
    } catch (err) {
      console.error('Post photo error:', err.message);
    }
  });

  // Like photo handler
  socket.on('like photo', async (data) => {
    try {
      const photo = await Photo.findById(data.photoId);
      if (photo) {
        // Prevent duplicate likes from the same user
        if (!photo.likedBy.includes(data.username)) {
          photo.likedBy.push(data.username);
          photo.likes += 1;
          await photo.save();
          const photos = await Photo.find().sort({ timestamp: -1 });
          io.emit('photos update', photos);
        }
      }
    } catch (err) {
      console.error('Like photo error:', err.message);
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
