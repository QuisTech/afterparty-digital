/* game.js - Amethyst mining clicker game, upgrades shop, and hidden gems */

import { state } from './state.js';
import { triggerLocalConfetti } from './utils.js';

export function mineGem(event) {
  if (!state.socket || !state.currentUser) return;

  // Emit a single click! Server scales gem reward by clickPower securely.
  state.socket.emit('mine gem');
  triggerLocalConfetti(event, ['#d946ef', '#701a75', '#a855f7']);
  animateGemClick();
}

export function buyUpgrade(type, cost, event) {
  if (!state.socket || !state.currentUser) return;

  // Simply emit purchase trigger. Server validates balance and updates data.
  state.socket.emit('buy upgrade', { type });
}

export function updateMiningUI() {
  const gemCountEl = document.getElementById('gem-count');
  const rankEl = document.getElementById('mining-rank');
  const progressEl = document.getElementById('mining-progress');

  if (gemCountEl) gemCountEl.innerText = state.gems;

  // Calculate dynamic costs exponentially based on server upgrades levels
  state.pickaxePrice = Math.floor(15 * Math.pow(1.5, Math.floor((state.clickPower - 1) / 2)));
  state.minerPrice = Math.floor(50 * Math.pow(1.6, state.autoMiners));

  let currentRank = "Stone Picker ⚒️";
  let minVal = 0;
  let maxVal = 5;

  if (state.gems >= 120) {
    currentRank = "Multiverse Miner 🏆";
    minVal = 120;
    maxVal = 120;
  } else if (state.gems >= 50) {
    currentRank = "Amethyst Tycoon 💎";
    minVal = 50;
    maxVal = 120;
  } else if (state.gems >= 20) {
    currentRank = "Deep Excavator ✨";
    minVal = 20;
    maxVal = 50;
  } else if (state.gems >= 5) {
    currentRank = "Gem Finder 🔍";
    minVal = 5;
    maxVal = 20;
  }

  if (rankEl) rankEl.innerText = currentRank;

  let pct = 100;
  if (maxVal > minVal) {
    pct = ((state.gems - minVal) / (maxVal - minVal)) * 100;
    pct = Math.min(100, Math.max(0, pct));
  }
  if (progressEl) progressEl.style.width = pct + "%";

  // Enable/disable shop purchase styling
  const pickaxeBtn = document.getElementById('btn-upgrade-pickaxe');
  const minerBtn = document.getElementById('btn-upgrade-miner');

  if (pickaxeBtn) {
    pickaxeBtn.innerText = `${state.pickaxePrice} 💎`;
    if (state.gems < state.pickaxePrice) {
      pickaxeBtn.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
      pickaxeBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    }
  }

  if (minerBtn) {
    minerBtn.innerText = `${state.minerPrice} 💎`;
    if (state.gems < state.minerPrice) {
      minerBtn.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
      minerBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    }
  }
}

export function collectHiddenGem(element, event) {
  if (state.socket) {
    // Collect 5 gems directly on the server by triggering click hits
    for (let i = 0; i < 5; i++) {
      state.socket.emit('mine gem');
    }
  }
  triggerLocalConfetti(event, ['#c084fc', '#00FFFF', '#FF007F']);

  // Visual feedback: Shrink and vanish crystal
  if (element) {
    element.style.pointerEvents = 'none';
    element.style.transform = 'scale(0) rotate(220deg)';
    element.style.opacity = '0';
    element.style.transition = 'all 0.6s cubic-bezier(0.6, -0.28, 0.735, 0.045)';

    // Floating indicator bubble
    const rect = element.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'gem-popup';
    popup.innerText = '+5 💎';
    popup.style.position = 'fixed';
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 1000);
  }
}

function animateGemClick() {
  const gem = document.querySelector('.gem-clicker svg');
  if (gem) {
    gem.style.transform = 'scale(0.9)';
    setTimeout(() => gem.style.transform = 'scale(1)', 100);
  }
}
