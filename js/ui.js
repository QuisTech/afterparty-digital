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

export function createCavern(e) {
  e.preventDefault();
  const nameEl = document.getElementById('event-name');
  const timeEl = document.getElementById('event-time');
  const maxEl = document.getElementById('event-max');

  const name = nameEl ? nameEl.value.trim() : '';
  const launchTime = timeEl ? timeEl.value.trim() : '';
  const capacity = maxEl ? parseInt(maxEl.value.trim(), 10) : 100;

  if (state.socket) {
    state.socket.emit('create cavern', { name, launchTime, capacity });
    state.socket.emit('chat message', { message: `🌋 New cavern shaft deployed: "${name}" launching ${launchTime} (Max capacity: ${capacity})!` });
  }

  const eventForm = document.getElementById('event-form');
  if (eventForm) eventForm.reset();
  triggerConfetti();
}

export function requestToJoinTeam(teamName, event) {
  if (state.socket) {
    state.socket.emit('join inquiry', { teamName });
  }
  triggerLocalConfetti(event, ['#00FFFF', '#FF007F']);
}

export function resolveTeamInquiry(teamName, attendeeName, action) {
  if (state.socket) {
    state.socket.emit('respond inquiry', { teamName, attendeeName, action });
  }
}

export const slotTechs = ["AI Agent", "IoT Core", "Web3 DB", "Rust Core", "AR Glass", "Crypto Vault", "Neural Mesh", "Edge Server"];
export const slotRealms = ["Caverns", "Space", "Ecology", "Health", "FinTech", "Music", "Education", "Gaming"];
export const slotFocus = ["Security", "Gamified", "Eco Friendly", "Offline First", "Real-Time", "Privacy", "Accessibility", "Low-Code"];

const techColors = ["#FF007F", "#00FFFF", "#FFB800", "#10B981", "#A78BFA", "#F43F5E", "#3B82F6", "#F59E0B"];
const realmColors = ["#00FFFF", "#FFB800", "#FF007F", "#A78BFA", "#10B981", "#3B82F6", "#F59E0B", "#EC4899"];
const focusColors = ["#FFB800", "#FF007F", "#00FFFF", "#10B981", "#A78BFA", "#3B82F6", "#EC4899", "#F59E0B"];

export function generateProjectIdea(tech, realm, focus) {
  const techNouns = {
    "AI Agent": ["Autonomous Cog", "Neural Envoy", "AI Warden", "Cognitive Proxy"],
    "IoT Core": ["Sensor Grid", "Tether Node", "Ambient Link", "Telemetry Hub"],
    "Web3 DB": ["Decentral Trust", "Ledger Vault", "Consensus Store", "Chain Registry"],
    "Rust Core": ["Ironforge Engine", "Oxidized Kernel", "Rustbound Daemon", "Safe Conduit"],
    "AR Glass": ["Retinal Overlay", "Spatial HUD", "Optic Matrix", "Holo Prism"],
    "Crypto Vault": ["Enclave Shield", "Cipher Safe", "Zero-Knowledge Safe", "Crypt Vault"],
    "Neural Mesh": ["Synaptic Grid", "Cerebral Loom", "Mesh Intelligencer", "Neuro Cluster"],
    "Edge Server": ["Border Node", "Periphery Gateway", "Edge Vanguard", "Local Sentinel"]
  };

  const realmNouns = {
    "Caverns": ["Subterranean", "Underdark", "Deep-Rock", "Speleo"],
    "Space": ["Orbital", "Exosphere", "Cosmic", "Astral"],
    "Ecology": ["Biosphere", "Eco-System", "Greenfield", "Biotope"],
    "Health": ["Clinical", "Biomed", "Somat", "Pathfinder"],
    "FinTech": ["Securities", "Fiscal", "Ledger-Flow", "Cap-Market"],
    "Music": ["Acoustic", "Harmonic", "Waveform", "Sonar"],
    "Education": ["Scholastic", "Pedagogy", "Cognition", "Academics"],
    "Gaming": ["Interactive", "Simulacra", "Luden", "Playground"]
  };

  const goalSuffixes = {
    "Security": ["Sentinel", "Shield", "Fortress", "Bastion"],
    "Gamified": ["Quest", "Odyssey", "Crucible", "Arcade"],
    "Eco Friendly": ["Flora", "Gaia", "Equilibrium", "Cycle"],
    "Offline First": ["Vault", "Anchor", "Bunker", "Outpost"],
    "Real-Time": ["Sync", "Pulse", "Vortex", "Velocity"],
    "Privacy": ["Shadow", "Enigma", "Cloak", "Sanctum"],
    "Accessibility": ["Bridge", "Nexus", "Beacon", "Equinox"],
    "Low-Code": ["Canvas", "Forge", "Studio", "Builder"]
  };

  const techDescs = {
    "AI Agent": "Utilizes LLM-driven autonomous agents with tool-use capabilities to make real-time decisions",
    "IoT Core": "Deploys a low-power mesh network of physical telemetry sensors collecting telemetry stream data",
    "Web3 DB": "Establishes a decentralized, tamper-proof state layer with consensus verification",
    "Rust Core": "Leverages a memory-safe, ultra-high-performance engine compiled in Rust for concurrent workload safety",
    "AR Glass": "Injects real-time spatial overlays and interactive HUD widgets into a wearable augmented-reality optic display",
    "Crypto Vault": "Secures key assets within hardware-isolated zero-knowledge enclave vaults",
    "Neural Mesh": "Runs decentralized ML inference across an interconnected swarm of local devices",
    "Edge Server": "Deploys a low-latency caching gateway to process and store heavy datasets locally"
  };

  const realmDescs = {
    "Caverns": "tailored for subterranean research, cave survey monitoring, and deep-earth exploration teams",
    "Space": "specifically designed to survive extreme environments, high-radiation orbits, and deep-space communications",
    "Ecology": "focused on planetary restoration, carbon capture tracking, and environmental footprint modeling",
    "Health": "engineered to satisfy medical HIPAA standards, patient diagnostics telemetry, and critical biosensor alerts",
    "FinTech": "integrated directly into algorithmic micro-transaction queues, liquidity pools, and verified ledger networks",
    "Music": "powering real-time multi-track audio synthesis, acoustic analysis, and spatial audio rendering",
    "Education": "providing collaborative learning environments, personalized pedagogy diagnostics, and visual cognitive aids",
    "Gaming": "driving dynamic gameplay mechanics, interactive simulations, and immersive multiplayer states"
  };

  const goalDescs = {
    "Security": "The architecture implements end-to-end encryption, multi-signature authentication, and zero-trust verification to defend against external interference.",
    "Gamified": "The system features immersive quests, experience points tracking, leveling up, and digital collectible rewards to incentivize high engagement.",
    "Eco Friendly": "The platform prioritizes green hosting providers, minimal network roundtrips, and optimized CPU cycles to minimize the environmental carbon footprint.",
    "Offline First": "It features robust local storage sync databases and conflict-free replicated data types (CRDTs) to function perfectly in remote locations without network.",
    "Real-Time": "Data flows through an ultra-low-latency websocket layer with visual push events, sub-10ms pub/sub delivery, and fluid UI reactive updates.",
    "Privacy": "Includes homomorphic encryption, local-only hashing, and differential privacy to guarantee user identity and data protection.",
    "Accessibility": "Designed with screen-reader optimizations, high-contrast states, keyboard-only shortcuts, and simplified interfaces for full inclusivity.",
    "Low-Code": "Includes a drag-and-drop builder canvas, visual node connections, and auto-generated boilerplates to allow rapid development by anyone."
  };

  const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const techHash = getHash(tech);
  const realmHash = getHash(realm);
  const goalHash = getHash(focus);

  const tNoun = techNouns[tech][techHash % techNouns[tech].length];
  const rNoun = realmNouns[realm][realmHash % realmNouns[realm].length];
  const gSuffix = goalSuffixes[focus][goalHash % goalSuffixes[focus].length];

  const title = `${rNoun} ${tNoun} - The ${gSuffix}`;
  const description = `${techDescs[tech]}, ${realmDescs[realm]}. ${goalDescs[focus]}`;

  let baseFeas = 85;
  if (tech === "AI Agent") baseFeas = 85;
  else if (tech === "IoT Core") baseFeas = 75;
  else if (tech === "Web3 DB") baseFeas = 70;
  else if (tech === "Rust Core") baseFeas = 80;
  else if (tech === "AR Glass") baseFeas = 60;
  else if (tech === "Crypto Vault") baseFeas = 75;
  else if (tech === "Neural Mesh") baseFeas = 55;
  else if (tech === "Edge Server") baseFeas = 85;

  let realmModFeas = 0;
  if (realm === "Caverns") realmModFeas = -5;
  else if (realm === "Space") realmModFeas = -15;
  else if (realm === "Ecology") realmModFeas = 0;
  else if (realm === "Health") realmModFeas = -10;
  else if (realm === "FinTech") realmModFeas = -10;
  else if (realm === "Music") realmModFeas = 5;
  else if (realm === "Education") realmModFeas = 5;
  else if (realm === "Gaming") realmModFeas = 0;

  let goalModFeas = 0;
  if (focus === "Security") goalModFeas = -5;
  else if (focus === "Gamified") goalModFeas = 0;
  else if (focus === "Eco Friendly") goalModFeas = 0;
  else if (focus === "Offline First") goalModFeas = -10;
  else if (focus === "Real-Time") goalModFeas = -5;
  else if (focus === "Privacy") goalModFeas = -5;
  else if (focus === "Accessibility") goalModFeas = 5;
  else if (focus === "Low-Code") goalModFeas = 10;

  let feasibilityVal = baseFeas + realmModFeas + goalModFeas;
  feasibilityVal = Math.min(98, Math.max(40, feasibilityVal));
  const feasibility = `${feasibilityVal}%`;

  let baseComp = 2;
  if (["AR Glass", "Neural Mesh"].includes(tech)) baseComp = 3.5;
  else if (["AI Agent", "IoT Core", "Web3 DB", "Crypto Vault"].includes(tech)) baseComp = 3;
  else if (["Rust Core"].includes(tech)) baseComp = 2.5;
  else baseComp = 2;

  let realmModComp = 0;
  if (realm === "Space") realmModComp = 1.5;
  else if (["Health", "FinTech"].includes(realm)) realmModComp = 1;
  else if (["Caverns", "Gaming"].includes(realm)) realmModComp = 0.5;

  let goalModComp = 0;
  if (["Security", "Privacy", "Offline First"].includes(focus)) goalModComp = 1;
  else if (["Real-Time", "Gamified", "Accessibility"].includes(focus)) goalModComp = 0.5;
  else if (focus === "Low-Code") goalModComp = -0.5;

  const totalComp = baseComp + realmModComp + goalModComp;
  let complexity = "Medium";
  if (totalComp >= 4) complexity = "Very High";
  else if (totalComp >= 3) complexity = "High";
  else if (totalComp >= 2) complexity = "Medium";
  else complexity = "Low";

  return { title, description, feasibility, complexity };
}

export function initOracle() {
  const slotTechEl = document.getElementById('slot-tech');
  const slotIndustryEl = document.getElementById('slot-industry');
  const slotFocusEl = document.getElementById('slot-focus');

  if (!slotTechEl || !slotIndustryEl || !slotFocusEl) return;

  const reps = 6;

  let techHtml = '';
  for (let r = 0; r < reps; r++) {
    slotTechs.forEach((tech, i) => {
      const color = techColors[i % techColors.length];
      techHtml += `<div class="spinner-item" style="color: ${color};">${tech}</div>`;
    });
  }
  slotTechEl.innerHTML = techHtml;

  let industryHtml = '';
  for (let r = 0; r < reps; r++) {
    slotRealms.forEach((realm, i) => {
      const color = realmColors[i % realmColors.length];
      industryHtml += `<div class="spinner-item" style="color: ${color};">${realm}</div>`;
    });
  }
  slotIndustryEl.innerHTML = industryHtml;

  let focusHtml = '';
  for (let r = 0; r < reps; r++) {
    slotFocus.forEach((focus, i) => {
      const color = focusColors[i % focusColors.length];
      focusHtml += `<div class="spinner-item" style="color: ${color};">${focus}</div>`;
    });
  }
  slotFocusEl.innerHTML = focusHtml;

  slotTechEl.style.transform = 'translateY(0px)';
  slotIndustryEl.style.transform = 'translateY(0px)';
  slotFocusEl.style.transform = 'translateY(0px)';
}

export function spinDials(event) {
  const spinButton = event.currentTarget;
  if (spinButton.disabled) return;
  spinButton.disabled = true;
  spinButton.innerHTML = `SPINNING... <i class="fas fa-spinner fa-spin ml-1"></i>`;

  triggerLocalConfetti(event, ['#FFB800', '#FF007F']);

  const techTargetIdx = Math.floor(Math.random() * slotTechs.length);
  const realmTargetIdx = Math.floor(Math.random() * slotRealms.length);
  const focusTargetIdx = Math.floor(Math.random() * slotFocus.length);

  const slotTechEl = document.getElementById('slot-tech');
  const slotIndustryEl = document.getElementById('slot-industry');
  const slotFocusEl = document.getElementById('slot-focus');

  const targetTechOffset = -((4 * slotTechs.length) + techTargetIdx) * 48;
  const targetRealmOffset = -((4 * slotRealms.length) + realmTargetIdx) * 48;
  const targetFocusOffset = -((4 * slotFocus.length) + focusTargetIdx) * 48;

  if (slotTechEl) {
    slotTechEl.style.transition = 'transform 1.0s cubic-bezier(0.15, 0.85, 0.35, 1)';
    slotTechEl.style.transform = `translateY(${targetTechOffset}px)`;
  }
  if (slotIndustryEl) {
    slotIndustryEl.style.transition = 'transform 1.3s cubic-bezier(0.15, 0.85, 0.35, 1)';
    slotIndustryEl.style.transform = `translateY(${targetRealmOffset}px)`;
  }
  if (slotFocusEl) {
    slotFocusEl.style.transition = 'transform 1.6s cubic-bezier(0.15, 0.85, 0.35, 1)';
    slotFocusEl.style.transform = `translateY(${targetFocusOffset}px)`;
  }

  const tech = slotTechs[techTargetIdx];
  const realm = slotRealms[realmTargetIdx];
  const focus = slotFocus[focusTargetIdx];

  const { title, description, feasibility, complexity } = generateProjectIdea(tech, realm, focus);

  setTimeout(() => {
    const titleEl = document.getElementById('idea-title');
    const descEl = document.getElementById('idea-desc');
    const feasibilityEl = document.getElementById('idea-feasibility');
    const complexityEl = document.getElementById('idea-complexity');

    if (titleEl) {
      titleEl.innerText = title;
      titleEl.classList.add('animate-pulse');
      setTimeout(() => titleEl.classList.remove('animate-pulse'), 1000);
    }
    if (descEl) descEl.innerText = description;

    if (feasibilityEl) {
      feasibilityEl.innerText = feasibility;
      const val = parseInt(feasibility);
      if (val >= 80) {
        feasibilityEl.className = 'text-green-400 font-bold';
      } else if (val >= 60) {
        feasibilityEl.className = 'text-yellow-400 font-bold';
      } else {
        feasibilityEl.className = 'text-rose-400 font-bold';
      }
    }

    if (complexityEl) {
      complexityEl.innerText = complexity;
      if (complexity === 'Low') {
        complexityEl.className = 'text-green-400 font-bold';
      } else if (complexity === 'Medium') {
        complexityEl.className = 'text-[#00FFFF] font-bold';
      } else if (complexity === 'High') {
        complexityEl.className = 'text-orange-400 font-bold';
      } else {
        complexityEl.className = 'text-rose-500 font-bold animate-pulse';
      }
    }

    if (state.socket) {
      state.socket.emit('chat message', { message: `🎲 Generated project idea spark: "${title}"` });
    }

    setTimeout(() => {
      if (slotTechEl) {
        slotTechEl.style.transition = 'none';
        slotTechEl.style.transform = `translateY(${-(techTargetIdx * 48)}px)`;
      }
      if (slotIndustryEl) {
        slotIndustryEl.style.transition = 'none';
        slotIndustryEl.style.transform = `translateY(${-(realmTargetIdx * 48)}px)`;
      }
      if (slotFocusEl) {
        slotFocusEl.style.transition = 'none';
        slotFocusEl.style.transform = `translateY(${-(focusTargetIdx * 48)}px)`;
      }

      spinButton.disabled = false;
      spinButton.innerHTML = `ROLL IDEA DIALS <i class="fas fa-sync-alt ml-1"></i>`;

      triggerConfetti();
    }, 50);
  }, 1700);
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
  container.innerHTML = teams.map(t => {
    const isCreator = t.creator === state.currentUser;
    const isMember = t.members && t.members.includes(state.currentUser);
    const hasSentInquiry = t.inquiries && t.inquiries.includes(state.currentUser);

    let buttonHtml = '';
    if (isCreator) {
      buttonHtml = `
        <div class="w-full space-y-2">
          <div class="text-[9px] text-[#00FFFF] font-bold">👑 You are the Creator</div>
          ${t.inquiries && t.inquiries.length > 0 ? `
            <div class="space-y-1 mt-1 border-t border-white/10 pt-2">
              <div class="text-[8px] text-gray-400 uppercase tracking-widest">Pending Inquiries:</div>
              ${t.inquiries.map(user => `
                <div class="flex justify-between items-center bg-white/5 p-1.5 rounded-lg border border-white/5">
                  <span class="text-[9px] text-white font-bold">${user}</span>
                  <div class="flex gap-1">
                    <button onclick="resolveTeamInquiry('${t.name}', '${user}', 'accept')" class="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[7px] hover:bg-green-500/30 transition-all font-mono font-bold">Accept</button>
                    <button onclick="resolveTeamInquiry('${t.name}', '${user}', 'decline')" class="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[7px] hover:bg-rose-500/30 transition-all font-mono font-bold">Decline</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-[8px] text-gray-500 italic">No pending inquiries</div>
          `}
        </div>
      `;
    } else if (isMember) {
      buttonHtml = `
        <button disabled class="flex-grow py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest font-mono">
          Joined
        </button>
      `;
    } else if (hasSentInquiry) {
      buttonHtml = `
        <button disabled class="flex-grow py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest font-mono">
          Inquiry Sent
        </button>
      `;
    } else {
      buttonHtml = `
        <button onclick="requestToJoinTeam('${t.name}', event)" class="flex-grow py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold">
          Send Inquiry
        </button>
      `;
    }

    const membersListHtml = t.members && t.members.length > 0 
      ? `<div class="text-[8px] font-mono text-gray-500 mt-1">Members: ${t.members.join(', ')}</div>`
      : '';

    return `
      <div class="glass-panel p-4 rounded-2xl border border-white/5 space-y-2 card-adventure relative">
        <span class="bg-[#00FFFF]/10 text-[#00FFFF] text-[8px] font-black px-2 py-0.5 rounded-full border border-[#00FFFF]/20 absolute top-4 right-4">${t.membersCount}/4 Members</span>
        <h4 class="text-sm font-black text-white uppercase tracking-tight">${t.name}</h4>
        <p class="text-[9px] text-gray-400 font-mono">Building project using: [${t.tech}]</p>
        <div class="pt-1 text-[8px] font-mono text-[#FFB800] uppercase tracking-wider font-bold">Needs: ${t.looking}</div>
        ${membersListHtml}
        <div class="flex gap-2 pt-2 text-[8px] font-black uppercase tracking-widest font-mono">
          ${buttonHtml}
        </div>
      </div>
    `;
  }).join('');
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
