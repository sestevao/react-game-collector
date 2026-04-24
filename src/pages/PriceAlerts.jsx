import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getPriceAlerts, 
  deletePriceAlert, 
  updatePriceAlert,
  getPriceAlertNotifications,
  markNotificationSeen,
  checkPricesForAlerts,
  getGames,
  createPriceAlert
} from '../utils/api';
import useSettings from '../hooks/useSettings';

const PriceAlerts = () => {
  const { formatCurrency } = useSettings();
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [wishlistGames, setWishlistGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingPrices, setCheckingPrices] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsResponse, notificationsResponse, wishlistResponse] = await Promise.all([
        getPriceAlerts(),
        getPriceAlertNotifications(),
        getGames({ purchased: 'false', per_page: 'all' })
      ]);
      
      setAlerts(alertsResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      setWishlistGames(wishlistResponse.data?.data || []);
    } catch (error) {
      console.error('Error fetching price alerts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (gameId) => {
    try {
      await deletePriceAlert(gameId);
      setAlerts(prev => prev.filter(alert => alert.game_id !== gameId));
    } catch (error) {
      console.error('Error deleting price alert:', error);
    }
  };

  const handleUpdateTargetPrice = async (gameId, targetPrice) => {
    try {
      await updatePriceAlert(gameId, targetPrice, true);
      setAlerts(prev => prev.map(alert => 
        alert.game_id === gameId 
          ? { ...alert, target_price: targetPrice }
          : alert
      ));
    } catch (error) {
      console.error('Error updating price alert:', error);
    }
  };

  const handleMarkSeen = async (notificationId) => {
    try {
      await markNotificationSeen(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, seen: 1 }
          : notif
      ));
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  const handleCheckPrices = async () => {
    try {
      setCheckingPrices(true);
      const response = await checkPricesForAlerts();
      alert(`${response.data.message}. ${response.data.notifications} new price drops found!`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error checking prices:', error);
      alert('Failed to check prices. Please try again.');
    } finally {
      setCheckingPrices(false);
    }
  };

  const handleAddAlert = async (gameId) => {
    try {
      await createPriceAlert(gameId);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating price alert:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    }
  };

  const getWishlistGamesWithoutAlerts = () => {
    const alertedGameIds = new Set(alerts.map(alert => alert.game_id));
    return wishlistGames.filter(game => !alertedGameIds.has(game.id));
  };

  const unseenNotifications = notifications.filter(notif => !notif.seen);

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Price Alerts</h1>
            <p className="text-gray-600 dark:text-gray-400">Get notified when games in your wishlist go on sale</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCheckPrices}
              disabled={checkingPrices || alerts.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingPrices ? 'Checking...' : 'Check Prices Now'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Active Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition relative ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Price Drops ({notifications.length})
            {unseenNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unseenNotifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeTab === 'add'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Add Alerts
          </button>
        </div>

        {/* Active Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A1 1 0 012 7.414V16a2 2 0 002 2h8a2 2 0 002-2V8a1 1 0 00-.293-.707l-.707-.707A3 3 0 0011.5 6H8V5h3.5a4 4 0 012.828 1.172" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Price Alerts</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Start watching prices for games in your wishlist</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Add Your First Alert
                </button>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-900 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={alert.image_url || 'https://placehold.co/300x300?text=No+Image'}
                        className="w-full h-full object-cover"
                        alt={alert.title}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/game/${alert.game_id}`}
                        className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      >
                        {alert.title}
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {alert.platform_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Current Price</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {alert.current_price ? formatCurrency(alert.current_price) : '--'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Target Price</div>
                        <input
                          type="number"
                          step="0.01"
                          value={alert.target_price || ''}
                          onChange={(e) => handleUpdateTargetPrice(alert.game_id, e.target.value)}
                          className="w-20 text-lg font-bold text-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1"
                          placeholder="Any"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteAlert(alert.game_id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition"
                        title="Remove Alert"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Price Drops Yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Price drop notifications will appear here when games go on sale</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border transition ${
                    notification.seen 
                      ? 'border-gray-100 dark:border-gray-700' 
                      : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-900 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={notification.image_url || 'https://placehold.co/300x300?text=No+Image'}
                        className="w-full h-full object-cover"
                        alt={notification.title}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/game/${notification.game_id}`}
                        className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      >
                        {notification.title}
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {notification.platform_name} • {new Date(notification.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Price Drop</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-400 line-through">
                          {formatCurrency(notification.old_price)}
                        </span>
                        <span className="text-xl font-black text-green-600 dark:text-green-400">
                          {formatCurrency(notification.new_price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={notification.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                      >
                        View Deal
                      </a>
                      
                      {!notification.seen && (
                        <button
                          onClick={() => handleMarkSeen(notification.id)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          Mark Seen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Alerts Tab */}
        {activeTab === 'add' && (
          <div className="space-y-4">
            {getWishlistGamesWithoutAlerts().length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">All Set!</h3>
                <p className="text-gray-500 dark:text-gray-400">All your wishlist games already have price alerts, or you don't have any wishlist games yet.</p>
                <Link 
                  to="/library"
                  className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Add Games to Wishlist
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Wishlist Games Without Alerts</h3>
                  <p className="text-gray-600 dark:text-gray-400">Click "Watch Price" to get notified when these games go on sale</p>
                </div>
                
                {getWishlistGamesWithoutAlerts().map(game => (
                  <div key={game.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-900 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={game.image_url || 'https://placehold.co/300x300?text=No+Image'}
                          className="w-full h-full object-cover"
                          alt={game.title}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/game/${game.id}`}
                          className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        >
                          {game.title}
                        </Link>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {game.platform?.name}
                        </div>
                      </div>

                      <div className="text-right mr-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Current Price</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {game.current_price ? formatCurrency(game.current_price) : '--'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddAlert(game.id)}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                      >
                        Watch Price
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAlerts;