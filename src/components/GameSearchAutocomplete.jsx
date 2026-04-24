import { useState, useEffect, useRef } from 'react';
import { searchGameMetadata } from '../utils/api';

const GameSearchAutocomplete = ({ onSelect, placeholder = "Search for a game..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const searchGames = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const response = await searchGameMetadata(query);
        setResults(response.data.games || []);
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error searching games:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchGames, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (game) => {
    setQuery(game.title);
    setShowResults(false);
    setSelectedIndex(-1);
    onSelect(game);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (e.target.value.length < 2) {
      setShowResults(false);
    }
  };

  return (
    <div className="relative" ref={resultsRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-lg shadow-sm"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((game, index) => (
            <button
              key={game.id}
              onClick={() => handleSelect(game)}
              className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  {game.image_url && (
                    <img
                      src={game.image_url}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {game.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {game.released_at && (
                      <span>{new Date(game.released_at).getFullYear()}</span>
                    )}
                    {game.released_at && game.genres && (
                      <span>•</span>
                    )}
                    {game.genres && (
                      <span className="truncate">{game.genres.split(',')[0]}</span>
                    )}
                  </div>
                  {game.platforms && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                      {game.platforms.slice(0, 3).join(', ')}
                      {game.platforms.length > 3 && ` +${game.platforms.length - 3} more`}
                    </div>
                  )}
                </div>
                
                {game.metascore && (
                  <div className="flex-shrink-0">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
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
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
          No games found for "{query}"
        </div>
      )}
    </div>
  );
};

export default GameSearchAutocomplete;