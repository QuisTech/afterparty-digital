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

app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ gems: -1 }).limit(10).select('name gems clickPower autoMiners role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/caverns', async (req, res) => {
  try {
    const caverns = await Cavern.find();
    res.json(caverns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/photos', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ timestamp: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset-database', async (req, res) => {
  try {
    console.log('🔄 Manual database reset requested...');
    // Delete all collections
    await User.deleteMany({});
    await Message.deleteMany({});
    await Cavern.deleteMany({});
    await Team.deleteMany({});
    await Photo.deleteMany({});

    // Reseed fresh data
    await seedDatabase();

    // Retrieve fresh documents
    const users = await User.find().select('name gems role');
    const caverns = await Cavern.find();
    const teams = await Team.find();
    const photos = await Photo.find().sort({ timestamp: -1 });
    const messages = [];

    // Broadcast update events to all active websockets
    io.emit('users update', users);
    io.emit('caverns update', caverns);
    io.emit('teams update', teams);
    io.emit('photos update', photos);
    io.emit('chat history', messages);
    io.emit('system message', '🔄 Caverns and shafts reset manually to default seeded values! 🔄');

    res.json({ status: 'success', message: 'Database reset and seeded successfully.' });
  } catch (err) {
    console.error('Error resetting database:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------
const userSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  role: { type: String, default: 'Full Stack Dev' },
  gems: { type: Number, default: 0 },
  clickPower: { type: Number, default: 1 },
  autoMiners: { type: Number, default: 0 },
  totalGemsMined: { type: Number, default: 0 },
  totalUpgradesPurchased: { type: Number, default: 0 },
  achievements: { type: [String], default: [] },
  lastUpgradeTime: { type: Date, default: null }
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
  creator: { type: String, required: true },
  members: { type: [String], default: [] },
  inquiries: { type: [String], default: [] }
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
        { name: 'Michquis', gems: 120, clickPower: 5, autoMiners: 3, role: 'AI Engineer' },
        { name: 'QuantumMiner', gems: 85, clickPower: 3, autoMiners: 2, role: 'ML Researcher' },
        { name: 'AetherCavern', gems: 64, clickPower: 3, autoMiners: 1, role: 'SysAdmin' },
        { name: 'CyberGoose', gems: 42, clickPower: 1, autoMiners: 1, role: 'Full Stack Dev' },
        { name: 'NovaDesigner', gems: 38, clickPower: 1, autoMiners: 0, role: 'UX Designer' },
        { name: 'PixelArtisan', gems: 29, clickPower: 1, autoMiners: 0, role: 'UX Designer' },
        { name: 'RustCoder', gems: 24, clickPower: 1, autoMiners: 0, role: 'Full Stack Dev' },
        { name: 'DevopsSage', gems: 15, clickPower: 1, autoMiners: 0, role: 'SysAdmin' }
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
        { name: 'Amethyst AI Guild', looking: 'AI Engineer', tech: 'Python, PyTorch', membersCount: 3, creator: 'Michquis', members: ['Michquis', 'QuantumMiner', 'AetherCavern'], inquiries: [] },
        { name: 'Glider Designers', looking: 'UX Designer', tech: 'Figma, Tailwind', membersCount: 2, creator: 'NovaDesigner', members: ['NovaDesigner', 'PixelArtisan'], inquiries: [] },
        { name: 'Rust Cavernites', looking: 'Full Stack Dev', tech: 'Rust, Node.js', membersCount: 1, creator: 'RustCoder', members: ['RustCoder'], inquiries: [] }
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
// ---------------------------------------------------------------------------
// Socket.io Helpers & Background Cycles
// ---------------------------------------------------------------------------

async function checkAchievements(user, socket) {
  const achievements = [];
  const oldAchievementsCount = user.achievements ? user.achievements.length : 0;

  if (user.totalGemsMined >= 1000 && !user.achievements?.includes('master_miner')) {
    achievements.push('master_miner');
    user.gems += 100;
  }

  if (user.totalUpgradesPurchased >= 10 && !user.achievements?.includes('upgrade_master')) {
    achievements.push('upgrade_master');
    user.gems += 200;
  }

  if (achievements.length > 0) {
    user.achievements = user.achievements || [];
    user.achievements.push(...achievements);
    await user.save();

    // Notify user of updated stats and stats update
    socket.emit('user stats', {
      gems: user.gems,
      clickPower: user.clickPower,
      autoMiners: user.autoMiners,
      totalGemsMined: user.totalGemsMined,
      totalUpgradesPurchased: user.totalUpgradesPurchased,
      achievements: user.achievements
    });

    socket.emit('gem update', { username: user.name, gems: user.gems });

    achievements.forEach(ach => {
      const displayNames = {
        'master_miner': 'Master Miner 🏆 (+100 💎)',
        'upgrade_master': 'Upgrade Master 👑 (+200 💎)'
      };
      io.emit('system message', `🏆 ACHIEVEMENT UNLOCKED! ${user.name} achieved: ${displayNames[ach] || ach}!`);
    });

    const users = await User.find().select('name gems role');
    io.emit('users update', users);
  }
}

// Server-Side Auto-Miner passive scheduler ticking once a second
setInterval(async () => {
  try {
    let updatedAny = false;
    for (const socket of io.sockets.sockets.values()) {
      if (socket.username) {
        const user = await User.findOne({ name: socket.username });
        if (user && user.autoMiners > 0) {
          const passiveGems = user.autoMiners;
          user.gems += passiveGems;
          user.totalGemsMined += passiveGems;
          await user.save();
          updatedAny = true;

          socket.emit('gem update', {
            username: user.name,
            gems: user.gems,
            earned: passiveGems
          });

          await checkAchievements(user, socket);
        }
      }
    }

    if (updatedAny) {
      const users = await User.find().select('name gems role');
      io.emit('users update', users);
    }
  } catch (err) {
    console.error('Server-side auto-miner error:', err.message);
  }
}, 1000);

// ---------------------------------------------------------------------------
// Socket.io Events
// ---------------------------------------------------------------------------
io.on('connection', async (socket) => {
  console.log(`🟢 Client connected [${socket.id}]`);

  // 1. Send public chat history
  const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
  socket.emit('chat history', messages.reverse());

  // 2. Send active users list
  const users = await User.find().select('name gems role');
  socket.emit('users update', users);

  // 3. Send active caverns
  const caverns = await Cavern.find();
  socket.emit('caverns update', caverns);

  // 4. Send forged teams
  const teams = await Team.find();
  socket.emit('teams update', teams);

  // 5. Send photo wall
  const photos = await Photo.find().sort({ timestamp: -1 });
  socket.emit('photos update', photos);

  socket.on('join', async (data) => {
    let username = '';
    let role = 'Full Stack Dev';

    if (typeof data === 'string') {
      username = data;
    } else if (data && typeof data === 'object') {
      username = data.username;
      role = data.role || 'Full Stack Dev';
    }

    if (!username) return;
    socket.username = username;
    
    try {
      // Register or fetch user atomically, updating/syncing the latest selected role
      const user = await User.findOneAndUpdate(
        { name: username },
        { 
          $setOnInsert: { gems: 0, clickPower: 1, autoMiners: 0 },
          $set: { role: role }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      socket.emit('user stats', {
        gems: user.gems,
        clickPower: user.clickPower,
        autoMiners: user.autoMiners,
        totalGemsMined: user.totalGemsMined || 0,
        totalUpgradesPurchased: user.totalUpgradesPurchased || 0,
        achievements: user.achievements || []
      });

      const updatedUsers = await User.find().select('name gems role');
      io.emit('users update', updatedUsers);
      io.emit('system message', `✨ ${username} joined! ✨`);
    } catch (err) {
      console.error('Error in socket join:', err.message);
      // Fallback: reload the user if a duplicate key exception was thrown concurrently
      const user = await User.findOne({ name: username });
      if (user) {
        socket.emit('user stats', {
          gems: user.gems,
          clickPower: user.clickPower,
          autoMiners: user.autoMiners,
          totalGemsMined: user.totalGemsMined || 0,
          totalUpgradesPurchased: user.totalUpgradesPurchased || 0,
          achievements: user.achievements || []
        });
      }
    }
  });

  // Chat message handler
  socket.on('chat message', async (data) => {
    await Message.create({ username: socket.username, message: data.message });
    io.emit('chat message', { username: socket.username, message: data.message });
  });

  // Gem mining handler (Server-side multiplier applied!)
  socket.on('mine gem', async () => {
    if (!socket.username) return;
    const user = await User.findOne({ name: socket.username });
    if (user) {
      const gemsEarned = user.clickPower;
      user.gems += gemsEarned;
      user.totalGemsMined += gemsEarned;
      await user.save();
      
      socket.emit('gem update', { username: socket.username, gems: user.gems });
      
      const users = await User.find().select('name gems');
      io.emit('users update', users);

      await checkAchievements(user, socket);
    }
  });

  // Secure server-side buy upgrade transaction handler
  socket.on('buy upgrade', async (data) => {
    if (!socket.username) return;
    const user = await User.findOne({ name: socket.username });
    if (!user) return;

    // Rate limiting purchase trigger to prevent console click macros
    if (user.lastUpgradeTime && Date.now() - user.lastUpgradeTime < 1000) {
      socket.emit('error', { message: 'Please wait before buying another upgrade' });
      return;
    }

    let cost = 0;
    let updateDoc = {};
    let upgradeName = '';

    if (data.type === 'pickaxe') {
      cost = Math.floor(15 * Math.pow(1.5, Math.floor((user.clickPower - 1) / 2)));
      if (user.gems >= cost) {
        updateDoc = {
          $inc: {
            gems: -cost,
            clickPower: 2,
            totalUpgradesPurchased: 1
          },
          $set: {
            lastUpgradeTime: new Date()
          }
        };
        upgradeName = `a +${user.clickPower + 2} pickaxe! ⚒️`;
      }
    } else if (data.type === 'miner') {
      cost = Math.floor(50 * Math.pow(1.6, user.autoMiners));
      if (user.gems >= cost) {
        updateDoc = {
          $inc: {
            gems: -cost,
            autoMiners: 1,
            totalUpgradesPurchased: 1
          },
          $set: {
            lastUpgradeTime: new Date()
          }
        };
        upgradeName = `a goose miner! 🦆`;
      }
    }

    if (cost && Object.keys(updateDoc).length > 0) {
      const updatedUser = await User.findOneAndUpdate(
        { name: socket.username },
        updateDoc,
        { new: true }
      );

      socket.emit('user stats', {
        gems: updatedUser.gems,
        clickPower: updatedUser.clickPower,
        autoMiners: updatedUser.autoMiners,
        totalGemsMined: updatedUser.totalGemsMined,
        totalUpgradesPurchased: updatedUser.totalUpgradesPurchased,
        achievements: updatedUser.achievements
      });

      socket.emit('gem update', { username: socket.username, gems: updatedUser.gems });
      
      const users = await User.find().select('name gems');
      io.emit('users update', users);

      io.emit('system message', `📢 ${socket.username} purchased ${upgradeName}`);
      
      await checkAchievements(updatedUser, socket);
    } else {
      socket.emit('error', { 
        message: `Need ${cost - user.gems} more gems for ${data.type === 'pickaxe' ? 'Pickaxe' : 'Goose Miner'}!` 
      });
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
      const username = socket.username || 'Anonymous';
      await Team.findOneAndUpdate(
        { name: data.name },
        { 
          name: data.name, 
          looking: data.looking, 
          tech: data.tech, 
          membersCount: 1,
          creator: username,
          members: [username],
          inquiries: []
        },
        { upsert: true }
      );
      const teams = await Team.find();
      io.emit('teams update', teams);
    } catch (err) {
      console.error('Create Team error:', err.message);
    }
  });

  // Join Team Inquiry handler
  socket.on('join inquiry', async (data) => {
    try {
      const username = socket.username;
      if (!username) return;
      const team = await Team.findOne({ name: data.teamName });
      if (team) {
        // Prevent duplicate inquiries, creator inquiring, or member inquiring
        if (team.creator === username || (team.members && team.members.includes(username)) || (team.inquiries && team.inquiries.includes(username))) {
          return;
        }
        team.inquiries = team.inquiries || [];
        team.inquiries.push(username);
        await team.save();
        
        const teams = await Team.find();
        io.emit('teams update', teams);
        io.emit('system message', `📩 ${username} requested to join team "${team.name}"!`);
      }
    } catch (err) {
      console.error('Join inquiry error:', err.message);
    }
  });

  // Respond Team Inquiry handler
  socket.on('respond inquiry', async (data) => {
    try {
      const username = socket.username;
      if (!username) return;
      const team = await Team.findOne({ name: data.teamName });
      if (team && team.creator === username) {
        // Remove from inquiries list
        team.inquiries = (team.inquiries || []).filter(u => u !== data.attendeeName);
        if (data.action === 'accept') {
          team.members = team.members || [];
          if (!team.members.includes(data.attendeeName)) {
            team.members.push(data.attendeeName);
            team.membersCount = team.members.length;
            io.emit('system message', `🎉 ${data.attendeeName} has joined the team "${team.name}"!`);
          }
        } else {
          io.emit('system message', `❌ Request for ${data.attendeeName} to join "${team.name}" was declined.`);
        }
        await team.save();

        const teams = await Team.find();
        io.emit('teams update', teams);
      }
    } catch (err) {
      console.error('Respond inquiry error:', err.message);
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
