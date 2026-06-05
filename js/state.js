/* state.js - Shared application state */

export const state = {
  gems: 0,
  clickPower: 1,
  autoMiners: 0,
  pickaxePrice: 15,
  minerPrice: 50,
  matches: new Set(),
  convosCount: 12,
  currentRoleFilter: 'all',
  searchQuery: '',
  socket: null,
  currentUser: null,
  onlineUsers: []
};
