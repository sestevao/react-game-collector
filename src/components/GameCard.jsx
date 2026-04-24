import { Link } from 'react-router-dom';
import useSettings from '../hooks/useSettings';

const GameCard = ({ game, onEdit, onDelete, viewMode = 'gallery' }) => {
  const { formatCurrency } = useSettings();

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

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 sm:rounded-xl flex overflow-hidden group border border-gray-100 dark:border-gray-700 h-28">
        <div className="w-24 sm:w-32 h-full flex-shrink-0 relative bg-gray-200 dark:bg-gray-900 overflow-hidden">
          <img
            src={game.image_url || 'https://placehold.co/600x400?text=No+Image'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt="Game Cover"
          />
        </div>
        
        <div className="flex-1 p-3 sm:p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-1.5">
              <Link 
                to={`/game/${game.id}`}
                className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 text-base sm:text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors hover:underline"
              >
                {game.title}
              </Link>
              {game.released_at && (
                <span className="hidden sm:inline-block text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                  {new Date(game.released_at).getFullYear()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                {game.platform?.name || 'Unknown Platform'}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
              <span className="truncate max-w-[150px]">
                {game.genres ? game.genres.split(',')[0] : 'No Genre'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
            <div className="hidden md:block">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${getStatusColor(game.status)}`}>
                {(game.status || 'Uncategorized').replace('_', ' ')}
              </span>
            </div>

            <div className="text-right min-w-[80px]">
              <div className="font-black text-indigo-600 dark:text-indigo-400 text-lg leading-none mb-1">
                {game.current_price ? formatCurrency(game.current_price) : '--'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2 sm:pl-4 border-l border-gray-100 dark:border-gray-700">
            <button
              onClick={() => onEdit(game)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-blue-500 transition-all shadow-sm"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(game)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-all shadow-sm"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
      <div className="aspect-[16/9] overflow-hidden relative bg-gray-100 dark:bg-gray-900">
        <img
          src={game.image_url || 'https://placehold.co/600x400?text=No+Image'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt="Game Cover"
        />
        
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-md px-2 py-1.5 rounded-lg shadow-sm border border-white/10 z-10 flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">
            {game.platform?.name}
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <Link
            to={`/game/${game.id}`}
            className="bg-white text-gray-800 hover:bg-indigo-600 hover:text-white p-2.5 rounded-full shadow-lg transition-all transform hover:scale-110"
            title="View Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <button
            onClick={() => onEdit(game)}
            className="bg-white text-gray-800 hover:bg-indigo-600 hover:text-white p-2.5 rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Edit Game"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(game)}
            className="bg-white text-gray-800 hover:bg-red-600 hover:text-white p-2.5 rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Delete Game"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-3">
          <Link 
            to={`/game/${game.id}`}
            className="text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors hover:underline block"
          >
            {game.title}
          </Link>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap mt-2">
            {game.released_at && (
              <span className="bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                {new Date(game.released_at).getFullYear()}
              </span>
            )}
            {game.genres && (
              <span className="truncate max-w-[150px] bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                {game.genres.split(',')[0]}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(game.status)}`}>
            {(game.status || 'Uncategorized').replace('_', ' ')}
          </span>

          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
            {game.current_price ? formatCurrency(game.current_price) : '--'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;