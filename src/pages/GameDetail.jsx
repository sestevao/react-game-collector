import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGame, getGamePrices, updateGame, deleteGame } from '../utils/api';
import useSettings from '../hooks/useSettings';

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  
  const [game, setGame] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await getGame(id);
      setGame(response.data);
      setEditData({
        status: response.data.status || 'uncategorized',
        rating: response.data.rating || '',
        current_price: response.data.current_price || '',
        notes: response.data.notes || ''
      });
    } catch (error) {
      console.error('Error fetching game:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      setPricesLoading(true);
      const response = await getGamePrices(id);
      setPrices(response.data.prices || []);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setPricesLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateGame(id, {
        ...game,
        ...editData
      });
      setGame(prev => ({ ...prev, ...editData }));
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${game.title}"?`)) {
      try {
        await deleteGame(id);
        navigate('/library');
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'currently_playing':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'played':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'not_played':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Game Not Found</h1>
          <Link to="/library" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/library"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </Link>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Edit Game
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Game Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-64 bg-gray-200 dark:bg-gray-900 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={game.image_url || 'https://placehold.co/600x400?text=No+Image'}
                    className="w-full h-full object-cover"
                    alt={game.title}
                  />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                    {game.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                      {game.platform?.name}
                    </span>
                    
                    {game.released_at && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                        {new Date(game.released_at).getFullYear()}
                      </span>
                    )}
                    
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(game.status)}`}>
                      {(game.status || 'Uncategorized').replace('_', ' ')}
                    </span>
                  </div>
                  
                  {game.genres && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {game.genres.split(',').map((genre, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                            {genre.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {game.metascore && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Metascore</h3>
                        <div className={`inline-flex px-3 py-1 rounded-lg text-lg font-bold ${
                          game.metascore >= 75 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : game.metascore >= 50
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {game.metascore}
                        </div>
                      </div>
                    )}
                    
                    {game.rating && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">My Rating</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(game.rating) 
                                  ? 'text-yellow-400' 
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {game.rating}/5
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Comparison */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Price Comparison</h2>
                <button
                  onClick={fetchPrices}
                  disabled={pricesLoading}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {pricesLoading ? 'Checking...' : 'Check Prices'}
                </button>
              </div>
              
              {prices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prices.map((price, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{price.platform}</h3>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(price.price)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Last checked: {new Date(price.last_checked).toLocaleString()}
                      </div>
                      <a
                        href={price.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View on {price.platform}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Click "Check Prices" to see current prices across platforms</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Purchase Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Purchase Info</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    game.purchased 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                  }`}>
                    {game.purchased ? 'Owned' : 'Wishlist'}
                  </span>
                </div>
                
                {game.price && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Price Paid</h3>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(game.price)}
                    </span>
                  </div>
                )}
                
                {game.current_price && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Value</h3>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(game.current_price)}
                    </span>
                  </div>
                )}
                
                {game.purchase_location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Purchased From</h3>
                    <span className="text-gray-900 dark:text-white">{game.purchase_location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {game.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notes</h2>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {game.notes}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Added</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(game.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {game.updated_at !== game.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(game.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Game</h2>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-lg"
                  >
                    <option value="uncategorized">Uncategorized</option>
                    <option value="not_played">Not Played</option>
                    <option value="currently_playing">Currently Playing</option>
                    <option value="played">Played</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    My Rating (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={editData.rating}
                    onChange={(e) => setEditData(prev => ({ ...prev, rating: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-lg"
                    placeholder="4.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.current_price}
                    onChange={(e) => setEditData(prev => ({ ...prev, current_price: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-lg"
                    placeholder="29.99"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-lg"
                    rows="3"
                    placeholder="Add your notes about this game..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetail;