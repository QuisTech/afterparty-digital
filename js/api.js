/* api.js - Client REST API wrapper for HTTP endpoints */

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
  ? 'http://localhost:3000/api'
  : '/api';

export async function fetchLeaderboard() {
  const response = await fetch(`${API_BASE}/leaderboard`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

export async function fetchTeams() {
  const response = await fetch(`${API_BASE}/teams`);
  if (!response.ok) throw new Error('Failed to fetch teams');
  return response.json();
}

export async function fetchCaverns() {
  const response = await fetch(`${API_BASE}/caverns`);
  if (!response.ok) throw new Error('Failed to fetch caverns');
  return response.json();
}

export async function fetchPhotos() {
  const response = await fetch(`${API_BASE}/photos`);
  if (!response.ok) throw new Error('Failed to fetch photos');
  return response.json();
}

export async function healthCheck() {
  const response = await fetch(`${API_BASE.replace('/api', '')}/health`);
  if (!response.ok) throw new Error('Failed to fetch health check');
  return response.json();
}
