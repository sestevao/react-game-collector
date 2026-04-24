import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Platforms
export const getPlatforms = () => api.get('/platforms');

// Games
export const getGames = (params = {}) => api.get('/games', { params });
export const createGame = (gameData) => api.post('/games', gameData);
export const updateGame = (id, gameData) => api.put(`/games/${id}`, gameData);
export const deleteGame = (id) => api.delete(`/games/${id}`);
export const bulkCreateGames = (games) => api.post('/games/bulk', { games });

// Statistics
export const getGameStatistics = () => api.get('/games/statistics');
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecentGames = () => api.get('/dashboard/recent');

// Game metadata and prices
export const searchGameMetadata = (query) => api.get('/games/search-metadata', { params: { query } });
export const getGame = (id) => api.get(`/games/${id}`);
export const getGamePrices = (id) => api.get(`/games/${id}/prices`);

// Bulk operations
export const bulkDeleteGames = (ids) => api.delete('/games/bulk', { data: { ids } });
export const importGames = (games, skipDuplicates = true) => api.post('/games/import', { games, skipDuplicates });

// Duplicate checking
export const checkDuplicate = (title, platform_id) => api.get('/games/check-duplicate', { params: { title, platform_id } });

export default api;
