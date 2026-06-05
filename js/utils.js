/* utils.js - Component Loader, Confetti & SVG Layout utilities */

const componentCache = new Map();

function injectComponent(html, selector) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
}

/**
 * Dynamically loads an HTML component, caching the response.
 * Includes error recovery using a fallback template.
 */
export async function loadComponent(name, path, containerSelector, fallbackHtml = '') {
  try {
    const cached = componentCache.get(path);
    if (cached) {
      injectComponent(cached, containerSelector);
      return cached;
    }

    const response = await fetch(`${path}?_=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    componentCache.set(path, html);
    injectComponent(html, containerSelector);
    return html;
  } catch (error) {
    console.error(`Failed to load component "${name}" from path "${path}":`, error);
    if (fallbackHtml) {
      injectComponent(fallbackHtml, containerSelector);
    }
    return null;
  }
}

/**
 * Trigger local particle sparks relative to click event coordinates.
 */
export function triggerLocalConfetti(event, colors) {
  const x = event ? event.clientX / window.innerWidth : 0.5;
  const y = event ? event.clientY / window.innerHeight : 0.8;
  confetti({
    particleCount: 15,
    spread: 35,
    origin: { x, y },
    colors: colors || ['#FF007F', '#00FFFF', '#FFB800']
  });
}

/**
 * Trigger a full-screen congratulatory splash of sparks.
 */
export function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF007F', '#00FFFF', '#FFB800']
  });
}

/**
 * Generates the railroad ties/sleepers along the sloped diagonal track dynamically.
 */
export function generateRailroadTies() {
  const sleepersGroup = document.getElementById('sleepers-group');
  if (!sleepersGroup) return;

  const startX = 50, startY = 800;
  const endX = 5850, endY = 3800;
  const dx = endX - startX;
  const dy = endY - startY;
  const L = Math.sqrt(dx * dx + dy * dy);
  const numSleepers = Math.floor(L / 32);

  const px = -dy / L * 15;
  const py = dx / L * 15;

  let sleepersHTML = '';
  for (let i = 0; i <= numSleepers; i++) {
    const t = i / numSleepers;
    const cx = startX + t * dx;
    const cy = startY + t * dy;
    sleepersHTML += `<line x1="${cx - px}" y1="${cy - py}" x2="${cx + px}" y2="${cy + py}" stroke="#78350f" stroke-width="4.5" stroke-linecap="round" />`;
  }
  sleepersGroup.innerHTML = sleepersHTML;
}
