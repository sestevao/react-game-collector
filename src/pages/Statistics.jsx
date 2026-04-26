import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGameStatistics, getGameImageSrc } from '../utils/api';

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
      setStats({
        totalGames: response.data?.totalGames || 0,
        totalValue: response.data?.totalValue || 0,
        platforms: Array.isArray(response.data?.platforms) ? response.data.platforms : [],
        statuses: Array.isArray(response.data?.statuses) ? response.data.statuses : [],
        topValued: Array.isArray(response.data?.topValued) ? response.data.topValued : []
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStats({
        totalGames: 0,
        totalValue: 0,
        platforms: [],
        statuses: [],
        topValued: []
      });
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

        {/* Platform Breakdown with Bar Chart */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Platform Breakdown</h3>
          {stats.platforms.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No games added yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.platforms.map((platform, index) => {
                const maxCount = Math.max(...stats.platforms.map(p => p.count));
                const percentage = (platform.count / maxCount) * 100;
                const colors = [
                  'bg-indigo-500',
                  'bg-purple-500', 
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-red-500',
                  'bg-pink-500',
                  'bg-cyan-500'
                ];
                const color = colors[index % colors.length];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="font-medium text-gray-900 dark:text-white">{platform.platform_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">{platform.count} games</div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-400">{formatCurrency(platform.total_value)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${color} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
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
                        {(game.has_image || game.image_url) && (
                          <img src={getGameImageSrc(game, '')} className="w-full h-full object-cover" alt={game.title} />
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

          {/* Status Breakdown with Donut Chart */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Collection Status</h3>
            {stats.statuses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No games added yet.</p>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Donut Chart */}
                <div className="relative w-48 h-48 flex-shrink-0">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      const total = stats.statuses.reduce((sum, status) => sum + status.count, 0);
                      let cumulativePercentage = 0;
                      const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
                      
                      return stats.statuses.map((status, index) => {
                        const percentage = (status.count / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = -cumulativePercentage;
                        cumulativePercentage += percentage;
                        
                        return (
                          <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="15.915"
                            fill="transparent"
                            stroke={colors[index % colors.length]}
                            strokeWidth="8"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                            style={{ 
                              strokeLinecap: 'round',
                              transformOrigin: '50% 50%'
                            }}
                          />
                        );
                      });
                    })()}
                    {/* Center circle */}
                    <circle cx="50" cy="50" r="8" fill="currentColor" className="text-gray-100 dark:text-gray-700" />
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {stats.totalGames}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Total
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {stats.statuses.map((status, index) => {
                    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
                    const total = stats.statuses.reduce((sum, s) => sum + s.count, 0);
                    const percentage = ((status.count / total) * 100).toFixed(1);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          ></div>
                          <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">
                            {(status.status || 'Uncategorized').replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">{status.count}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Statistics;