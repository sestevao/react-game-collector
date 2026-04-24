import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getRecentGames, getMilestones } from '../utils/api';
import useSettings from '../hooks/useSettings';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalGames: 0,
    totalValue: 0,
    completed: 0
  });
  const [recentGames, setRecentGames] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, recentResponse, milestonesResponse] = await Promise.all([
          getDashboardStats(),
          getRecentGames(),
          getMilestones()
        ]);
        setStats(statsResponse.data || { totalGames: 0, totalValue: 0, completed: 0 });
        setRecentGames(Array.isArray(recentResponse.data) ? recentResponse.data : []);
        setMilestones(Array.isArray(milestonesResponse.data) ? milestonesResponse.data : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({ totalGames: 0, totalValue: 0, completed: 0 });
        setRecentGames([]);
        setMilestones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome & Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Welcome Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome back!</h1>
              <p className="text-indigo-100 text-lg mb-8 max-w-lg">
                Your collection is growing. You have {stats.totalGames} games currently tracked in your library.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/library"
                  className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add New Game
                </Link>
                <Link
                  to="/library"
                  className="px-6 py-3 bg-indigo-800/50 text-white border border-indigo-400/30 font-bold rounded-xl hover:bg-indigo-800/70 transition flex items-center gap-2"
                >
                  View Library
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Value</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white truncate">
                {formatCurrency(stats.totalValue)}
              </div>
              <div className="text-xs text-green-500 font-bold mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 15.293 6.293A1 1 0 0115 7h-3z" clipRule="evenodd" />
                </svg>
                Collection value
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Games</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {stats.totalGames}
              </div>
              <div className="text-xs text-indigo-500 font-bold mt-2">
                Across all platforms
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completed</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {stats.completed}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                <div 
                  className="bg-green-500 h-1.5 rounded-full" 
                  style={{ width: `${stats.totalGames > 0 ? (stats.completed / stats.totalGames) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Backlog</div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {stats.totalGames - stats.completed}
              </div>
              <div className="text-xs text-orange-500 font-bold mt-2">
                Needs attention
              </div>
            </div>
          </div>
        </div>

        {/* Collection Milestones */}
        {milestones.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Collection Milestones</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {milestones.filter(m => m.unlocked).length} of {milestones.length} unlocked
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {milestones.slice(0, 16).map(milestone => (
                <div
                  key={milestone.id}
                  className={`group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all duration-300 ${
                    milestone.unlocked 
                      ? 'border-yellow-200 dark:border-yellow-800 hover:shadow-lg hover:-translate-y-1' 
                      : 'border-gray-100 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-2xl mb-3 ${
                      milestone.unlocked 
                        ? `${milestone.color} text-white shadow-lg` 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}>
                      {milestone.unlocked ? milestone.icon : '🔒'}
                    </div>
                    
                    <h3 className={`font-bold text-sm mb-1 ${
                      milestone.unlocked 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {milestone.title}
                    </h3>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {milestone.description}
                    </p>
                    
                    {milestone.unlocked && milestone.unlocked_at && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        {new Date(milestone.unlocked_at).toLocaleDateString('en-GB', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    )}
                    
                    {!milestone.unlocked && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {milestone.threshold} {milestone.type === 'games' ? 'games' : 
                           milestone.type === 'completed' ? 'completed' :
                           milestone.type === 'platforms' ? 'platforms' : 'value'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Added Games */}
        {recentGames.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Recently Added</h2>
              <Link 
                to="/library" 
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-1"
              >
                View All
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {recentGames.map(game => (
                <Link
                  key={game.id}
                  to={`/game/${game.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-900 overflow-hidden">
                    <img
                      src={game.image_url || 'https://placehold.co/300x300?text=No+Image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={game.title}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {game.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {game.platform?.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(game.created_at).toLocaleDateString('en-GB', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/library"
            className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Browse Library</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage your games</p>
              </div>
            </div>
          </Link>

          <Link
            to="/statistics"
            className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">View Statistics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detailed collection insights</p>
              </div>
            </div>
          </Link>

          <Link
            to="/settings"
            className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customize your experience</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;