/* socket.js - Socket.io connection setup and event routing */

import { state } from './state.js';
import { updateMiningUI } from './game.js';
import { 
  appendChatMessage, 
  updateLeaderboardAndAttendees, 
  renderCaverns, 
  renderTeams, 
  renderPhotos 
} from './ui.js';

export function setupSocket(backendUrl) {
  // Connect to socket.io
  state.socket = io(backendUrl);

  // Connection listeners
  state.socket.on('connect', () => {
    console.log('⚡ Socket connected to backend:', backendUrl);
    if (state.currentUser) {
      state.socket.emit('join', state.currentUser);
    }
  });

  // Load persistent stats directly from database user document
  state.socket.on('user stats', (stats) => {
    state.gems = stats.gems;
    state.clickPower = stats.clickPower;
    state.autoMiners = stats.autoMiners;
    updateMiningUI();
  });

  state.socket.on('chat history', (messages) => {
    const board = document.getElementById('chat-board');
    if (board) {
      board.innerHTML = '';
      messages.forEach(m => appendChatMessage(m.username, m.message));
      board.scrollTop = board.scrollHeight;
    }
  });

  state.socket.on('chat message', (data) => {
    appendChatMessage(data.username, data.message);
    if (data.username !== state.currentUser) {
      confetti({ particleCount: 5, spread: 20, colors: ['#FFB800', '#00FFFF'] });
    }
  });

  state.socket.on('system message', (msg) => {
    const board = document.getElementById('chat-board');
    if (board) {
      const div = document.createElement('div');
      div.className = 'border-b border-white/5 pb-1 text-gray-500 italic text-center font-bold text-[8px]';
      div.innerText = msg;
      board.appendChild(div);
      board.scrollTop = board.scrollHeight;
    }
  });

  state.socket.on('users update', (users) => {
    updateLeaderboardAndAttendees(users);
  });

  state.socket.on('gem update', (data) => {
    if (state.currentUser && data.username === state.currentUser) {
      state.gems = data.gems;
      updateMiningUI();
    }
  });

  state.socket.on('caverns update', (caverns) => {
    renderCaverns(caverns);
  });

  state.socket.on('teams update', (teams) => {
    renderTeams(teams);
  });

  state.socket.on('photos update', (photos) => {
    renderPhotos(photos);
  });

  // Listen for socket errors (e.g. rate limit notifications)
  state.socket.on('error', (err) => {
    console.error('Socket error received:', err.message);
    const board = document.getElementById('chat-board');
    if (board) {
      const div = document.createElement('div');
      div.className = 'border-b border-white/5 pb-1 text-rose-500 italic text-center font-bold text-[8px]';
      div.innerText = `⚠️ SYSTEM ERROR: ${err.message}`;
      board.appendChild(div);
      board.scrollTop = board.scrollHeight;
    }
  });
}
