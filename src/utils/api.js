import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getGameImageUrl = (id) => `${String(API_BASE_URL).replace(/\/$/, '')}/games/${id}/image`;
export const getGameImageSrc = (game, fallback = 'https://placehold.co/600x400?text=No+Image') => (
  game?.has_image ? getGameImageUrl(game.id) : (game?.image_url || fallback)
);

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
export const refreshGameMetadata = (id) => api.post(`/games/${id}/refresh-metadata`);
export const refreshGamePrices = (id) => api.post(`/games/${id}/refresh-prices`);

// Bulk operations
export const bulkDeleteGames = (ids) => api.delete('/games/bulk', { data: { ids } });
export const importGames = (games, skipDuplicates = true) => api.post('/games/import', { games, skipDuplicates });

// Duplicate checking
export const checkDuplicate = (title, platform_id) => api.get('/games/check-duplicate', { params: { title, platform_id } });

// Price Alerts
export const getPriceAlerts = () => api.get('/price-alerts');
export const createPriceAlert = (game_id, target_price) => api.post('/price-alerts', { game_id, target_price });
export const updatePriceAlert = (gameId, target_price, is_active) => api.put(`/price-alerts/${gameId}`, { target_price, is_active });
export const deletePriceAlert = (gameId) => api.delete(`/price-alerts/${gameId}`);
export const getPriceAlertNotifications = () => api.get('/price-alerts/notifications');
export const markNotificationSeen = (id) => api.put(`/price-alerts/notifications/${id}/seen`);
export const checkPricesForAlerts = () => api.post('/price-alerts/check');
export const getUnseenNotificationsCount = () => api.get('/price-alerts/notifications/count');

// Milestones
export const getMilestones = () => api.get('/milestones');
export const checkMilestones = () => api.post('/milestones/check');
export const markMilestoneSeen = (id) => api.put(`/milestones/${id}/seen`);
export const getUnseenMilestonesCount = () => api.get('/milestones/unseen/count');

export default api;
