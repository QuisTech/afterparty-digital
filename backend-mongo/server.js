const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ⭐ REPLACE THE PASSWORD BELOW ⭐
const MONGODB_URI = 'mongodb+srv://michquis_db_user:eDzC2nVlElZjAEHj@afterpartycluster.3snvrrx.mongodb.net/afterparty?appName=AfterpartyCluster';

console.log('📡 Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ Error:', err.message));

const userSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  gems: { type: Number, default: 0 }
});
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

io.on('connection', (socket) => {
  console.log('🟢 User connected');
  
  socket.on('join', async (username) => {
    socket.username = username;
    await User.findOneAndUpdate({ name: username }, { name: username }, { upsert: true });
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
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`💎 MongoDB: ${mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}\n`);
});
