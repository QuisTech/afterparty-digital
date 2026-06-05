/* main.js - Application entry point and orchestrator */

import { state } from './state.js';
import { loadComponent, generateRailroadTies, triggerLocalConfetti } from './utils.js';
import { setupSocket } from './socket.js';
import { mineGem, buyUpgrade, updateMiningUI, collectHiddenGem } from './game.js';
import {
  scrollToTop,
  handleSearch,
  filterRole,
  showIcebreaker,
  closeModal,
  toggleMatch,
  sendChat,
  createTeam,
  requestToJoinTeam,
  spinDials,
  handleUpload,
  handleLikePhoto,
  handleJoin,
  renderAttendees,
  updateLeaderboardAndAttendees,
  resetDatabase
} from './ui.js';

// Calculate backend server address
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
  ? 'http://localhost:3000'
  : 'https://d1mjg93qeqleyh.cloudfront.net';

// Expose modules globally to support legacy inline HTML event bindings and generate_demo.py
window.scrollToTop = scrollToTop;
window.handleSearch = handleSearch;
window.filterRole = filterRole;
window.showIcebreaker = showIcebreaker;
window.closeModal = closeModal;
window.toggleMatch = toggleMatch;
window.sendChat = sendChat;
window.createTeam = createTeam;
window.requestToJoinTeam = requestToJoinTeam;
window.spinDials = spinDials;
window.handleUpload = handleUpload;
window.handleLikePhoto = handleLikePhoto;
window.handleJoin = handleJoin;
window.mineGem = mineGem;
window.buyUpgrade = buyUpgrade;
window.collectHiddenGem = collectHiddenGem;
window.updateLeaderboardAndAttendees = updateLeaderboardAndAttendees;
window.resetDatabase = resetDatabase;

// Setup layout configurations and loading timers
async function initApp() {
  console.log('🎮 Initializing Afterparty Digital...');

  // 1. Inject all layouts and realm templates in parallel
  await Promise.all([
    loadComponent('header', 'components/header.html', '#header-container'),
    loadComponent('footer', 'components/footer.html', '#footer-container'),
    loadComponent('modals', 'components/modals.html', '#modal-container'),
    loadComponent('realm1', 'components/realms/realm1.html', '#realm-1'),
    loadComponent('realm2', 'components/realms/realm2.html', '#realm-2'),
    loadComponent('realm3', 'components/realms/realm3.html', '#realm-3'),
    loadComponent('realm4', 'components/realms/realm4.html', '#realm-4'),
    loadComponent('realm5', 'components/realms/realm5.html', '#realm-5'),
    loadComponent('realm6', 'components/realms/realm6.html', '#realm-6')
  ]);

  // 2. Generate track ties SVG vectors
  generateRailroadTies();

  // 3. Render base lists and stats
  updateMiningUI();
  renderAttendees();

  // 4. Setup web sockets
  setupSocket(BACKEND_URL);


  // 6. Dismiss loading overlay screen
  const loader = document.getElementById('loading-overlay');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 500);
  }

  // 7. Signal to Playwright/Automated scripts that loading has finished
  window.__APP_READY__ = true;
  console.log('✅ App fully loaded and initialized!');
}

// Stepped Scroll Mapping Logic (slide south inside realm, then slide diagonally to next)
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = Math.min(1, Math.max(0, scrollY / maxScroll));

  // Compute stepped positions for 6 realms
  const N = 6;
  const totalWeight = 5.6; // 6 realms * 0.6 (inspect) + 5 transitions * 0.4 (transition)
  const S = scrollPercent * totalWeight;
  const i = Math.min(N - 1, Math.floor(S));
  const f = S - i;

  let translateX = 0;
  let translateY = 0;

  if (i === N - 1) {
    // Last realm: only slides south, no next realm to transition to
    translateX = -i * 100;
    const t = Math.min(1, f / 0.6);
    translateY = -i * 60 - t * 40;
  } else {
    if (f <= 0.6) {
      // Phase 1: Slide south (inspect current realm)
      const t = f / 0.6;
      translateX = -i * 100;
      translateY = -i * 60 - t * 40;
    } else {
      // Phase 2: Slide diagonally to the next realm
      const t = (f - 0.6) / 0.4;
      translateX = -i * 100 - t * 100;
      translateY = (-i * 60 - 40) - t * 20;
    }
  }

  // Translate container using the calculated stepped coordinates
  const container = document.getElementById('scroll-container');
  if (container) {
    container.style.transform = `translate(${translateX}vw, ${translateY}vh)`;
  }

  // Parallax background translation (synchronized at 30% / 23.5% speed to match limits)
  const pBg = document.getElementById('parallax-bg');
  if (pBg) {
    const bgX = translateX * 0.3;
    const bgY = translateY * 0.235;
    pBg.style.transform = `translate(${bgX}vw, ${bgY}vh)`;
  }

  // Move minecart goose horizontally along the bottom of the viewport (Progress Indicator)
  const cart = document.getElementById('cart-container');
  if (cart) {
    const x = 5 + scrollPercent * 85; // 5vw to 90vw
    cart.style.left = `${x}vw`;
  }

  // Display/hide floating Back to Surface smooth-scroll button
  const btt = document.getElementById('back-to-top');
  if (btt) {
    if (scrollPercent > 0.35) {
      btt.classList.remove('scale-0', 'opacity-0');
      btt.classList.add('scale-100', 'opacity-100');
    } else {
      btt.classList.remove('scale-100', 'opacity-100');
      btt.classList.add('scale-0', 'opacity-0');
    }
  }
});

// Map horizontal trackpad mousewheel shifts to vertical window scrolls
window.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    window.scrollTo(0, window.scrollY + e.deltaX);
  }
});

// Run application
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
