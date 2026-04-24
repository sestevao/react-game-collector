import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGameStatistics } from '../utils/api';

const Statistics = () => {
  const [stats, setStats] = useState({
    totalGames: 0,
    totalValue: 0,
    platforms: [],
    statuses: [],
    topValued: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getGameStatistics();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Library Statistics
          </h2>
          <Link
            to="/library"
            className="px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white transition"
          >
            Back to Library
          </Link>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="text-gray-500 text-sm uppercase font-bold tracking-wider">Total Games</div>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.totalGames}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="text-gray-500 text-sm uppercase font-bold tracking-wider">Total Value</div>
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{formatCurrency(stats.totalValue)}</div>
            <div className="text-xs text-gray-400 mt-1">Current market value</div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Platform Breakdown</h3>
          {stats.platforms.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No games added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.platforms.map((platform, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{platform.platform_name}</div>
                    <div className="text-sm text-gray-500">{platform.count} Games</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(platform.total_value)}</div>
                    <div className="text-xs text-gray-400">Value</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Valued Games */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Top 5 Most Valuable</h3>
            {stats.topValued.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No games with values yet.</p>
            ) : (
              <div className="space-y-4">
                {stats.topValued.map((game) => (
                  <div key={game.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-900 rounded overflow-hidden flex-shrink-0">
                        {game.image_url && (
                          <img src={game.image_url} className="w-full h-full object-cover" alt={game.title} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{game.title}</div>
                        <div className="text-xs text-gray-500">{game.platform_name}</div>
                      </div>
                    </div>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(game.current_price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Collection Status</h3>
            {stats.statuses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No games added yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.statuses.map((status, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex justify-between items-center">
                    <div className="capitalize text-gray-700 dark:text-gray-300">
                      {(status.status || 'Uncategorized').replace('_', ' ')}
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-bold">
                      {status.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Statistics;