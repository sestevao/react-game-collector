import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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

// Game metadata and prices
export const searchGameMetadata = (query) => api.get('/games/search-metadata', { params: { query } });
export const getGame = (id) => api.get(`/games/${id}`);
export const getGamePrices = (id) => api.get(`/games/${id}/prices`);

// Bulk operations
export const bulkDeleteGames = (ids) => api.delete('/games/bulk', { data: { ids } });
export const importGames = (games) => api.post('/games/import', { games });

export default api;
