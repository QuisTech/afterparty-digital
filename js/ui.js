/* ui.js - UI rendering, filtering, event handlers, and chat boards */

import { state } from './state.js';
import { triggerLocalConfetti, triggerConfetti } from './utils.js';
import { updateMiningUI } from './game.js';

// Dynamic developer profiles mappings helper
export function getDeveloperProfile(name, databaseRole) {
  const roles = [
    { role: "AI Engineer", icon: "fa-robot", color: "#FF007F", tags: ["AI", "Dev"], icebreaker: "Ask about their favorite model weights!" },
    { role: "UX Designer", icon: "fa-palette", color: "#00FFFF", tags: ["Design"], icebreaker: "Ask what UI library they prefer!" },
    { role: "Full Stack Dev", icon: "fa-code", color: "#FFB800", tags: ["Dev"], icebreaker: "Ask about their preferred server stack!" },
    { role: "Product Manager", icon: "fa-briefcase", color: "#FF007F", tags: ["Design"], icebreaker: "Ask for their launch strategy!" },
    { role: "ML Researcher", icon: "fa-brain", color: "#00FFFF", tags: ["AI", "Dev"], icebreaker: "Ask about their parameter tuning!" },
    { role: "SysAdmin", icon: "fa-server", color: "#FFB800", tags: ["Dev"], icebreaker: "Ask why they avoid Docker in production!" }
  ];

  const bios = [
    "Python, PyTorch, Agentic workflows",
    "Figma design systems, premium UI layout",
    "Node.js, Rust core microservices",
    "Product roadmaps, Scrum sprints, Agile",
    "Transformers, LLMs, fine-tuning scripts",
    "Kubernetes cluster provisioning, PM2 logs"
  ];

  let r;
  let bio;

  if (databaseRole) {
    const foundIndex = roles.findIndex(x => x.role.toLowerCase() === databaseRole.toLowerCase());
    if (foundIndex !== -1) {
      r = roles[foundIndex];
      bio = bios[foundIndex];
    }
  }

  if (!r) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % roles.length;
    r = roles[index];
    bio = bios[index];
  }

  return {
    role: r.role,
    icon: r.icon,
    color: r.color,
    tags: r.tags,
    bio: bio,
    icebreaker: r.icebreaker
  };
}

export function scrollToTop(event) {
  if (event) event.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  triggerLocalConfetti(event, ['#00FFFF', '#FF007F', '#FFB800']);
}

export function handleSearch() {
  const searchInput = document.getElementById('search-input');
  state.searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
  renderAttendees();
}

export function filterRole(role) {
  state.currentRoleFilter = role;

  const buttons = ['all', 'AI', 'Dev', 'Design'];
  buttons.forEach(btn => {
    const el = document.getElementById(`btn-filter-${btn}`);
    if (el) {
      if (btn === role) {
        el.className = 'px-3 py-1 rounded-lg bg-slate-800 text-white font-bold';
      } else {
        el.className = 'px-3 py-1 rounded-lg text-gray-400 hover:text-white font-bold';
      }
    }
  });

  renderAttendees();
}

export function showIcebreaker(name, icebreaker) {
  const nameEl = document.getElementById('icebreaker-name');
  const textEl = document.getElementById('icebreaker-text');
  const modalEl = document.getElementById('icebreaker-modal');

  if (nameEl) nameEl.innerText = `Icebreaker Dialogue: ${name}`;
  if (textEl) textEl.innerText = icebreaker;
  if (modalEl) modalEl.style.display = 'flex';

  state.convosCount++;
  const statConvos = document.getElementById('stat-convos');
  if (statConvos) statConvos.innerText = state.convosCount;
}

export function closeModal() {
  const modalEl = document.getElementById('icebreaker-modal');
  if (modalEl) modalEl.style.display = 'none';
}

export function toggleMatch(username, event) {
  if (state.matches.has(username)) {
    state.matches.delete(username);
  } else {
    state.matches.add(username);
    triggerLocalConfetti(event, ['#FF007F', '#00FFFF']);

    // Broadcast connection match to live chat
    if (state.socket) {
      state.socket.emit('chat message', { message: `⚡ Connected spark matches with ${username}! 💖` });
    }
  }

  // Update UI
  const statMatches = document.getElementById('stat-matches');
  if (statMatches) statMatches.innerText = state.matches.size;

  const heart = document.getElementById(`match-heart-${username}`);
  const btn = document.getElementById(`match-btn-${username}`);
  if (heart && btn) {
    if (state.matches.has(username)) {
      heart.classList.remove('opacity-0');
      heart.classList.add('opacity-100');
      btn.className = 'flex-grow py-2 bg-[#FF007F] text-white rounded-xl transition-all';
      btn.innerText = 'Matched';
    } else {
      heart.classList.remove('opacity-100');
      heart.classList.add('opacity-0');
      btn.className = 'flex-grow py-2 bg-white text-slate-950 rounded-xl transition-all';
      btn.innerText = 'Match';
    }
  }
}

export function appendChatMessage(username, message) {
  const board = document.getElementById('chat-board');
  if (!board) return;

  const div = document.createElement('div');
  div.className = 'border-b border-white/5 pb-1';

  const span = document.createElement('span');
  let color = '#00FFFF';

  if (username === 'Taylor') color = '#FFB800';
  else if (username === 'Jamie') color = '#FF007F';
  else if (username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#00FFFF', '#FFB800', '#FF007F', '#10B981', '#A78BFA'];
    color = colors[Math.abs(hash) % colors.length];
  }

  span.style.color = color;
  span.className = 'font-bold mr-1';
  span.innerText = username ? `${username}:` : 'System:';

  div.appendChild(span);
  div.append(` ${message}`);
  board.appendChild(div);
  board.scrollTop = board.scrollHeight;
}

export function sendChat(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const msg = input ? input.value.trim() : '';
  if (!msg || !state.socket) return;

  state.socket.emit('chat message', { message: msg });
  if (input) input.value = '';
}

export function handleUpload() {
  const urlInput = document.getElementById('photo-url-input');
  let url = urlInput ? urlInput.value.trim() : '';

  const photoPool = [
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=450&fit=crop"
  ];

  if (!url) {
    url = photoPool[Math.floor(Math.random() * photoPool.length)];
  }

  if (state.socket) {
    state.socket.emit('post photo', { url: url });
    state.socket.emit('chat message', { message: `📸 Captured a visual flash moment in the Amethyst shafts!` });
  }

  if (urlInput) urlInput.value = '';
  triggerConfetti();
}

export function handleLikePhoto(photoId, event) {
  if (state.socket && state.currentUser) {
    state.socket.emit('like photo', { photoId: photoId, username: state.currentUser });
    triggerLocalConfetti(event, ['#FF007F', '#FFFFFF']);
  }
}

export function createTeam(e) {
  e.preventDefault();
  const nameEl = document.getElementById('team-name');
  const lookingEl = document.getElementById('team-looking');
  const techEl = document.getElementById('team-tech');

  const name = nameEl ? nameEl.value.trim() : '';
  const looking = lookingEl ? lookingEl.value.trim() : '';
  const tech = techEl ? techEl.value.trim() : '';

  if (state.socket) {
    state.socket.emit('create team', { name, looking, tech });
    state.socket.emit('chat message', { message: `🔨 Alliance project forged: "${name}" is recruiting "${looking}" using [${tech}]!` });
  }

  const teamForm = document.getElementById('team-form');
  if (teamForm) teamForm.reset();
  triggerConfetti();
}

export function requestToJoinTeam(btn, event) {
  if (!btn) return;
  btn.innerText = "Inquiry Sent!";
  btn.disabled = true;
  btn.classList.add('bg-green-600/20', 'text-green-400', 'border-green-500/30');
  triggerLocalConfetti(event, ['#00FFFF', '#FF007F']);
}

export function spinDials(event) {
  triggerLocalConfetti(event, ['#FFB800', '#FF007F']);

  const slotTechs = ["AI Agent", "IoT Core", "Web3 DB", "Rust Core", "AR Glass", "Crypto Vault", "Neural Mesh", "Edge Server"];
  const slotRealms = ["Caverns", "Space", "Ecology", "Health", "FinTech", "Music", "Education", "Gaming"];
  const slotFocus = ["Security", "Gamified", "Eco Friendly", "Offline First", "Real-Time", "Privacy", "Accessibility", "Low-Code"];

  const tech = slotTechs[Math.floor(Math.random() * slotTechs.length)];
  const realm = slotRealms[Math.floor(Math.random() * slotRealms.length)];
  const focus = slotFocus[Math.floor(Math.random() * slotFocus.length)];

  const slotTechEl = document.getElementById('slot-tech');
  const slotIndustryEl = document.getElementById('slot-industry');
  const slotFocusEl = document.getElementById('slot-focus');

  if (slotTechEl) slotTechEl.innerHTML = `<div class="spinner-item text-[#FF007F]">${tech}</div>`;
  if (slotIndustryEl) slotIndustryEl.innerHTML = `<div class="spinner-item text-[#00FFFF]">${realm}</div>`;
  if (slotFocusEl) slotFocusEl.innerHTML = `<div class="spinner-item text-[#FFB800]">${focus}</div>`;

  const titles = [
    `Autonomous ${tech} for ${realm} ${focus}`,
    `Next-Gen ${tech} in ${realm} Sector`,
    `${focus} ${tech} Platform for ${realm}`
  ];
  const descs = [
    `Build a highly-scalable ${tech} ecosystem designed specifically for ${realm} tracking, focused on delivering ${focus} metrics.`,
    `Formulate a developer-friendly ${tech} utility focusing on ${focus} operations within the ${realm} hackathon landscape.`,
    `An edge-ready ${tech} portal enabling participants to build ${focus} integrations in the active ${realm} arena.`
  ];

  const chosenTitle = titles[Math.floor(Math.random() * titles.length)];
  const titleEl = document.getElementById('idea-title');
  const descEl = document.getElementById('idea-desc');

  if (titleEl) titleEl.innerText = chosenTitle;
  if (descEl) descEl.innerText = descs[Math.floor(Math.random() * descs.length)];

  const feasibility = ["85%", "90%", "95%", "80%"][Math.floor(Math.random() * 4)];
  const complexity = ["Low", "Medium", "High"][Math.floor(Math.random() * 3)];

  const feasibilityEl = document.getElementById('idea-feasibility');
  const complexityEl = document.getElementById('idea-complexity');

  if (feasibilityEl) feasibilityEl.innerText = feasibility;
  if (complexityEl) complexityEl.innerText = complexity;

  // Broadcast project idea spin
  if (state.socket) {
    state.socket.emit('chat message', { message: `🎲 Generated project idea spark: "${chosenTitle}"` });
  }
}

export function handleJoin(e) {
  e.preventDefault();
  e.stopPropagation();

  const input = document.getElementById('join-username');
  const username = input ? input.value.trim() : '';

  const roleSelect = document.getElementById('join-role');
  const selectedRole = roleSelect ? roleSelect.value : 'Full Stack Dev';

  console.log('Join attempted with username:', username, 'selectedRole:', selectedRole);

  if (!username) {
    console.warn('No username provided');
    return;
  }

  state.currentUser = username;

  // Hide the modal
  const modal = document.getElementById('join-modal');
  if (modal) {
    modal.style.display = 'none';
    console.log('Modal hidden');
  }

  // Join room via socket
  if (state.socket && state.socket.connected) {
    state.socket.emit('join', { username: state.currentUser, role: selectedRole });
    console.log('Join event emitted with username and role');
  } else {
    console.warn('Socket not connected, join event queued');
  }
}

export function updateLeaderboardAndAttendees(usersList) {
  state.onlineUsers = usersList;

  // Update Header Metrics
  const statCheckins = document.getElementById('stat-checkins');
  if (statCheckins) statCheckins.innerText = usersList.length;

  const onlineCountEl = document.getElementById('online-count');
  if (onlineCountEl) onlineCountEl.innerText = usersList.length;

  // Sort users by gems descending
  usersList.sort((a, b) => b.gems - a.gems);

  // Render in attendee gallery
  renderAttendees();
}

export function renderAttendees() {
  const gallery = document.getElementById('attendee-gallery');
  if (!gallery) return;

  const filtered = state.onlineUsers.filter(p => {
    const profile = getDeveloperProfile(p.name, p.role);
    const matchesRole = state.currentRoleFilter === 'all' || profile.tags.includes(state.currentRoleFilter);
    const matchesSearch = p.name.toLowerCase().includes(state.searchQuery) ||
                          profile.role.toLowerCase().includes(state.searchQuery) ||
                          profile.bio.toLowerCase().includes(state.searchQuery);
    return matchesRole && matchesSearch;
  });

  if (filtered.length === 0) {
    gallery.innerHTML = `<div class="col-span-4 text-center py-10 text-gray-500 font-mono text-xs">NO DEVELOPERS UNCOVERED IN THIS SHAFT</div>`;
    return;
  }

  gallery.innerHTML = filtered.map((user, index) => {
    const profile = getDeveloperProfile(user.name, user.role);
    const isCurrentUser = user.name === state.currentUser;
    const isLeader = index === 0 && user.gems > 0;

    return `
      <div class="glass-panel p-5 rounded-2xl card-adventure relative group border border-white/5 hover:border-slate-800 transition-all duration-300">
        <div class="absolute top-4 right-4 text-[#FF007F] opacity-0 transition-opacity duration-300 ${state.matches.has(user.name) ? 'opacity-100' : ''}" id="match-heart-${user.name}">
          <i class="fas fa-heart text-md text-glow-magenta animate-pulse"></i>
        </div>
        ${isLeader ? `<div class="absolute -top-3 -left-3 bg-[#FFB800] text-slate-950 text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-wider rotate-[-5deg] z-20">👑 Leader</div>` : ''}
        <div class="w-12 h-12 bg-slate-950/80 border border-white/10 rounded-xl flex items-center justify-center text-xl text-white group-hover:border-[#FF007F]/50 transition-all duration-300">
          <i class="fas ${profile.icon}" style="color: ${profile.color};"></i>
        </div>
        <div class="mt-2">
          <h3 class="text-sm font-black text-white group-hover:text-[#FFB800] transition-colors">${user.name} ${isCurrentUser ? '(You)' : ''}</h3>
          <p class="text-[10px] uppercase font-mono font-bold tracking-widest" style="color: ${profile.color};">${profile.role}</p>
        </div>
        <div class="flex flex-wrap gap-1 font-mono text-[8px] mt-2">
          <span class="px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] rounded-full border border-[#FFD700]/20 font-bold">${user.gems} 💎</span>
          ${profile.bio.split(', ').map(tag => `<span class="px-2 py-0.5 bg-white/5 text-gray-400 rounded-full border border-white/5">${tag}</span>`).join('')}
        </div>
        <div class="flex gap-2 pt-2 text-[8px] font-black uppercase tracking-widest font-mono">
          <button onclick="showIcebreaker('${user.name}', '${profile.icebreaker}')" class="flex-grow py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">Icebreaker</button>
          <button onclick="toggleMatch('${user.name}', event)" id="match-btn-${user.name}" class="flex-grow py-2 ${state.matches.has(user.name) ? 'bg-[#FF007F] text-white' : 'bg-white text-slate-950'} rounded-xl transition-all">
            ${state.matches.has(user.name) ? 'Matched' : 'Match'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function renderCaverns(caverns) {
  const container = document.getElementById('events-container');
  if (!container) return;

  container.innerHTML = caverns.map(c => `
    <div class="glass-panel p-3 rounded-xl border-l-4 border-[#00FFFF] space-y-1">
      <div class="flex justify-between items-center text-[8px] font-mono text-gray-400">
        <span class="font-bold text-[#00FFFF]">${c.activeCount > 0 ? 'ACTIVE SHAFT' : 'CAVERN IGNITED'}</span>
        <span><i class="fas fa-users mr-0.5"></i> ${c.activeCount}/${c.capacity}</span>
      </div>
      <h4 class="text-[11px] font-black uppercase tracking-tight text-white">${c.name}</h4>
      <p class="text-[8px] text-gray-500 font-mono"><i class="fas fa-map-marker-alt mr-0.5"></i> The Amethyst Cave • ${c.launchTime}</p>
    </div>
  `).join('');
}

export function renderTeams(teams) {
  const container = document.getElementById('teams-container');
  if (!container) return;

  if (teams.length === 0) {
    container.innerHTML = `<div class="col-span-2 text-center py-10 text-gray-500 font-mono text-xs">NO FORGED ALLIANCES IN THIS SHAFT</div>`;
    return;
  }
  container.innerHTML = teams.map(t => `
    <div class="glass-panel p-4 rounded-2xl border border-white/5 space-y-2 card-adventure relative">
      <span class="bg-[#00FFFF]/10 text-[#00FFFF] text-[8px] font-black px-2 py-0.5 rounded-full border border-[#00FFFF]/20 absolute top-4 right-4">${t.membersCount}/4 Members</span>
      <h4 class="text-sm font-black text-white uppercase tracking-tight">${t.name}</h4>
      <p class="text-[9px] text-gray-400 font-mono">Building project using: [${t.tech}]</p>
      <div class="pt-1 text-[8px] font-mono text-[#FFB800] uppercase tracking-wider font-bold">Needs: ${t.looking}</div>
      <div class="flex gap-2 pt-2 text-[8px] font-black uppercase tracking-widest font-mono">
        <button onclick="requestToJoinTeam(this, event)" class="flex-grow py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold">Send Inquiry</button>
      </div>
    </div>
  `).join('');
}

export function renderPhotos(photos) {
  const container = document.getElementById('photo-wall');
  if (!container) return;

  if (photos.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-gray-500 font-mono text-[9px]">NO PHOTO FLASHES RECORDED</div>`;
    return;
  }
  container.innerHTML = photos.map(p => {
    const hasLiked = p.likedBy && p.likedBy.includes(state.currentUser);
    return `
      <div onclick="handleLikePhoto('${p._id}', event)" class="aspect-video rounded-2xl overflow-hidden glass-panel group cursor-pointer relative border border-white/5 hover:border-[#FFB800]/50 transition-all duration-300 shadow-md">
        <img src="${p.url}" class="w-full h-full object-cover opacity-50 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" onerror="this.src='https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=450&fit=crop'">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span class="text-white text-[9px] font-mono font-bold flex items-center gap-1">
            <i class="fas fa-heart ${hasLiked ? 'text-[#FF007F]' : 'text-white'} group-hover:scale-110 transition-transform mr-1"></i> 
            ${p.likes} ${p.likes === 1 ? 'Like' : 'Likes'} ${hasLiked ? '(Liked)' : ''}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

export async function resetDatabase() {
  const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : 'https://d1mjg93qeqleyh.cloudfront.net';

  if (!confirm("Are you sure you want to completely wipe the database and re-seed default values?")) {
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/reset-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('Database reset outcome:', data);

    // Clear local state and reload page
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  } catch (err) {
    console.error('Failed to wipe database:', err);
    alert('Failed to wipe database: ' + err.message);
  }
}
