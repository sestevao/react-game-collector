import { useState, useEffect } from 'react';
import { getGames, deleteGame } from '../utils/api';
import useSettings from '../hooks/useSettings';

const Settings = () => {
  const { settings, updateSetting } = useSettings();
  
  const [stats, setStats] = useState({
    totalGames: 0,
    databaseSize: '0 KB'
  });

  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getGames({ per_page: 'all' });
      setStats({
        totalGames: response.data.pagination.total,
        databaseSize: `${Math.round(JSON.stringify(response.data.data).length / 1024)} KB`
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const exportData = async () => {
    setExportLoading(true);
    try {
      const response = await getGames({ per_page: 'all' });
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        games: response.data.data
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-collection-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const clearAllData = async () => {
    setIsClearing(true);
    try {
      const response = await getGames({ per_page: 'all' });
      const games = response.data.data;
      
      // Delete all games one by one (since we don't have a bulk delete endpoint)
      for (const game of games) {
        await deleteGame(game.id);
      }
      
      setShowClearModal(false);
      fetchStats();
      alert('All data cleared successfully.');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const currencies = [
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Added' },
    { value: 'title', label: 'Title' },
    { value: 'price', label: 'Price' },
    { value: 'current_price', label: 'Current Price' },
    { value: 'metascore', label: 'Metascore' },
    { value: 'released_at', label: 'Release Date' }
  ];

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your Game Collector experience</p>
        </div>

        <div className="space-y-8">
          {/* Appearance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              Appearance
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: '☀️' },
                    { value: 'dark', label: 'Dark', icon: '🌙' },
                    { value: 'system', label: 'System', icon: '💻' }
                  ].map(theme => (
                    <button
                      key={theme.value}
                      onClick={() => updateSetting('theme', theme.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.theme === theme.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{theme.icon}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{theme.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Library Defaults */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Library Defaults
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default View</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'grid', label: 'Grid', icon: '⊞' },
                    { value: 'list', label: 'List', icon: '☰' }
                  ].map(view => (
                    <button
                      key={view.value}
                      onClick={() => updateSetting('defaultView', view.value)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        settings.defaultView === view.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-lg mb-1">{view.icon}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{view.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default Sort</label>
                <select
                  value={settings.defaultSort}
                  onChange={(e) => updateSetting('defaultSort', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Items Per Page</label>
                <div className="grid grid-cols-4 gap-3">
                  {['12', '24', '48', 'all'].map(count => (
                    <button
                      key={count}
                      onClick={() => updateSetting('itemsPerPage', count)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        settings.itemsPerPage === count
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {count === 'all' ? 'All' : count}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A1 1 0 012 7.414V16a2 2 0 002 2h8a2 2 0 002-2V8a1 1 0 00-.293-.707l-.707-.707A3 3 0 0011.5 6H8V5h3.5a4 4 0 012.828 1.172" />
              </svg>
              Notifications
              <span className="ml-2 px-2 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">Premium</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Price Drop Alerts</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Get notified when games in your wishlist go on sale</div>
                </div>
                <button
                  onClick={() => updateSetting('priceAlerts', !settings.priceAlerts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.priceAlerts ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.priceAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Collection Milestones</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Celebrate when you reach collection goals</div>
                </div>
                <button
                  onClick={() => updateSetting('milestoneAlerts', !settings.milestoneAlerts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.milestoneAlerts ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.milestoneAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Data Management
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Export Collection</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Download your games as JSON file</div>
                </div>
                <button
                  onClick={exportData}
                  disabled={exportLoading}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div>
                    <div className="font-medium text-red-900 dark:text-red-400">Clear All Data</div>
                    <div className="text-sm text-red-600 dark:text-red-400">Permanently delete all games from your collection</div>
                  </div>
                  <button
                    onClick={() => setShowClearModal(true)}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalGames}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Games</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-black text-gray-900 dark:text-white">v1.0.0</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">App Version</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.databaseSize}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Data Size</div>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-sm">
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</a>
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</a>
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Help & Support</a>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Clear All Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This will permanently delete all {stats.totalGames} games from your collection. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  disabled={isClearing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;