import { useState, useEffect, useRef } from 'react';
import { getGames, getPlatforms, createGame, updateGame, deleteGame, bulkCreateGames, importGames, searchGameMetadata } from '../utils/api';
import GameCard from '../components/GameCard';
import GameSearchAutocomplete from '../components/GameSearchAutocomplete';

const GameLibrary = () => {
  const [games, setGames] = useState({ data: [], pagination: {}, summary: {} });
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [viewMode, setViewMode] = useState('gallery');
  const [isBulk, setIsBulk] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    platform_id: '',
    status: 'all',
    purchased: 'true',
    order_by: 'created_at',
    direction: 'desc',
    page: 1,
    per_page: 24
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    platform_id: '',
    price: '',
    current_price: '',
    price_source: '',
    purchase_location: '',
    purchased: true,
    image_url: '',
    image_base64: '',
    image_mime: '',
    metascore: '',
    released_at: '',
    genres: '',
    rating: '',
    status: 'uncategorized',
    notes: ''
  });

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [skipImportDuplicates, setSkipImportDuplicates] = useState(true);
  const [importParseErrors, setImportParseErrors] = useState([]);
  const [importSummary, setImportSummary] = useState({ totalRows: 0, ready: 0, skipped: 0 });

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const scanFileInputRef = useRef(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    fetchGames();
    fetchPlatforms();
  }, [filters]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await getGames(filters);
      setGames({
        data: Array.isArray(response.data?.data) ? response.data.data : [],
        pagination: response.data?.pagination || {},
        summary: response.data?.summary || {}
      });
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames({ data: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await getPlatforms();
      setPlatforms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      setPlatforms([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = {
        ...prev,
        [key]: value
      };

      if (key !== 'page') {
        next.page = 1;
      }

      return next;
    });
  };

  const pickScannedTitle = (rawText) => {
    const lines = String(rawText || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const scored = lines
      .map(line => {
        const letters = (line.match(/[A-Za-z]/g) || []).length;
        const digits = (line.match(/[0-9]/g) || []).length;
        const score = letters * 2 - digits;
        return { line, score, letters };
      })
      .filter(x => x.letters >= 4 && x.line.length <= 80)
      .sort((a, b) => b.score - a.score);

    return scored[0]?.line || lines[0] || '';
  };

  const handleCoverFileChange = (file) => {
    if (!file) {
      setFormData(prev => ({ ...prev, image_base64: '', image_mime: '' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const match = result.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return;
      setFormData(prev => ({ ...prev, image_base64: match[2], image_mime: match[1] }));
    };
    reader.readAsDataURL(file);
  };

  const handleScanFileChange = async (file) => {
    if (!file) return;

    try {
      setScanError('');
      setScanLoading(true);

      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'eng');
      const title = pickScannedTitle(result?.data?.text);

      if (!title) {
        setScanError('Could not detect a title from that image.');
        return;
      }

      setFormData(prev => ({ ...prev, title }));

      try {
        const metadataResponse = await searchGameMetadata(title);
        const match = metadataResponse.data?.games?.[0];
        if (match) {
          setFormData(prev => ({
            ...prev,
            title: match.title || prev.title,
            image_url: match.image_url || prev.image_url,
            metascore: match.metascore || prev.metascore,
            released_at: match.released_at || prev.released_at,
            genres: match.genres || prev.genres
          }));
        }
      } catch (metadataError) {
        console.error('Error searching metadata after scan:', metadataError);
      }
    } catch (error) {
      console.error('Error scanning image:', error);
      setScanError('Scan failed. Try a clearer photo of the game title.');
    } finally {
      setScanLoading(false);
      if (scanFileInputRef.current) scanFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isBulk) {
        const titles = formData.title.split('\n').filter(t => t.trim().length > 0);
        const games = titles.map(title => ({
          title: title.trim(),
          platform_id: formData.platform_id,
          price: formData.price,
          current_price: formData.current_price,
          purchase_location: formData.purchase_location,
          purchased: formData.purchased
        }));
        await bulkCreateGames(games);
      } else if (editingGame) {
        await updateGame(editingGame.id, formData);
      } else {
        await createGame(formData);
      }
      
      setShowModal(false);
      setEditingGame(null);
      setIsBulk(false);
      resetForm();
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleEdit = (game) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      platform_id: game.platform_id,
      price: game.price || '',
      current_price: game.current_price || '',
      price_source: game.price_source || '',
      purchase_location: game.purchase_location || '',
      purchased: game.purchased,
      image_url: game.image_url || '',
      image_base64: '',
      image_mime: '',
      metascore: game.metascore || '',
      released_at: game.released_at || '',
      genres: game.genres || '',
      rating: game.rating || '',
      status: game.status || 'uncategorized'
    });
    setShowModal(true);
  };

  const handleDelete = async (game) => {
    if (confirm(`Are you sure you want to delete "${game.title}"?`)) {
      try {
        await deleteGame(game.id);
        fetchGames();
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      platform_id: '',
      price: '',
      current_price: '',
      price_source: '',
      purchase_location: '',
      purchased: true,
      image_url: '',
      image_base64: '',
      image_mime: '',
      metascore: '',
      released_at: '',
      genres: '',
      rating: '',
      status: 'uncategorized'
    });
    setScanError('');
    setScanLoading(false);
    if (scanFileInputRef.current) scanFileInputRef.current.value = '';
  };

  const resetImport = () => {
    setImportFile(null);
    setImportData([]);
    setImportLoading(false);
    setImportParseErrors([]);
    setImportSummary({ totalRows: 0, ready: 0, skipped: 0 });
    setSkipImportDuplicates(true);
  };

  const normalizeCsvKey = (value) => String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '_');

  const parseCsvToRows = (text) => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        continue;
      }

      if (ch === ',') {
        row.push(field);
        field = '';
        continue;
      }

      if (ch === '\r') {
        continue;
      }

      if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        continue;
      }

      field += ch;
    }

    row.push(field);
    rows.push(row);

    return rows
      .map(r => r.map(cell => String(cell ?? '').trim()))
      .filter(r => r.some(cell => cell.length > 0));
  };

  const parseCurrencyNumber = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9.\-]/g, '');
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const parsePurchasedValue = (value) => {
    if (typeof value === 'boolean') return value;
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return true;
    if (['yes', 'y', 'true', '1', 'owned', 'purchased'].includes(raw)) return true;
    if (['no', 'n', 'false', '0', 'wishlist'].includes(raw)) return false;
    return true;
  };

  const parseReleasedAt = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [dd, mm, yyyy] = raw.split('/');
      return `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const findPlatformIdFromCsv = (platformName) => {
    const raw = String(platformName ?? '').trim();
    if (!raw) return '';
    const normalized = raw.toLowerCase();
    const match = platforms.find(p => p.name.toLowerCase() === normalized || p.slug?.toLowerCase() === normalized);
    return match ? String(match.id) : '';
  };

  const parseGamesFromCsv = (csvText) => {
    const rows = parseCsvToRows(csvText);
    if (rows.length === 0) return { games: [], errors: ['CSV is empty'] };

    const header = rows[0].map(normalizeCsvKey);
    const body = rows.slice(1);

    const games = [];
    const errors = [];

    body.forEach((cells, idx) => {
      const rowNumber = idx + 2;
      const obj = {};
      header.forEach((key, i) => {
        obj[key] = cells[i] ?? '';
      });

      const title = String(obj.title ?? '').trim();
      const platform_id = findPlatformIdFromCsv(obj.platform);

      if (!title) {
        errors.push(`Row ${rowNumber}: missing Title`);
        return;
      }

      if (!platform_id) {
        errors.push(`Row ${rowNumber}: unknown Platform "${obj.platform || ''}"`);
        return;
      }

      games.push({
        title,
        platform_id,
        purchased: parsePurchasedValue(obj.purchased),
        status: String(obj.status || 'uncategorized').trim() || 'uncategorized',
        price: parseCurrencyNumber(obj.price),
        current_price: parseCurrencyNumber(obj.current_price),
        price_source: String(obj.price_source || '').trim() || null,
        purchase_location: String(obj.purchase_location || '').trim() || null,
        released_at: parseReleasedAt(obj.released_at),
        genres: String(obj.genres || '').trim() || null,
        rating: parseCurrencyNumber(obj.rating),
        metascore: obj.metascore ? Number.parseInt(String(obj.metascore).trim(), 10) : null,
        notes: String(obj.notes || '').trim() || null
      });
    });

    return { games, errors };
  };

  const downloadImportTemplate = () => {
    const header = [
      'Title',
      'Platform',
      'Purchased',
      'Status',
      'Price',
      'Current Price',
      'Price Source',
      'Purchase Location',
      'Released At',
      'Genres',
      'Rating',
      'Metascore'
    ].join(',');

    const example = [
      'A.O.T. 2',
      'PlayStation 4',
      'yes',
      'uncategorized',
      '39.99',
      '39.99',
      'PlayStation Store',
      '',
      '18/04/2018',
      'Action',
      '',
      '75'
    ].map(v => (String(v).includes(',') ? `"${String(v).replaceAll('"', '""')}"` : String(v))).join(',');

    const blob = new Blob([`${header}\n${example}\n`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-collection-import-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = async (file) => {
    setImportFile(file);
    setImportParseErrors([]);
    setImportData([]);
    setImportSummary({ totalRows: 0, ready: 0, skipped: 0 });

    if (!file) return;

    try {
      const text = await file.text();
      const { games: parsed, errors } = parseGamesFromCsv(text);
      setImportData(parsed);
      setImportParseErrors(errors);
      setImportSummary({ totalRows: Math.max(0, parseCsvToRows(text).length - 1), ready: parsed.length, skipped: errors.length });
    } catch (e) {
      setImportParseErrors([`Failed to read file: ${e?.message || String(e)}`]);
    }
  };

  const handleImportSubmit = async () => {
    if (importData.length === 0) return;

    try {
      setImportLoading(true);
      const response = await importGames(importData, skipImportDuplicates);
      alert(response.data?.message || 'Import completed');
      setShowImportModal(false);
      resetImport();
      fetchGames();
    } catch (error) {
      console.error('Error importing games:', error);
      alert('Failed to import games. Please check your CSV and try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value || 0);
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

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            My Collection
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                resetForm();
                setEditingGame(null);
                setIsBulk(false);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
            >
              Add Game
            </button>
            <button
              onClick={() => {
                resetImport();
                setShowImportModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
            >
              Import
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-2xl mb-6 p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
            <div className="flex gap-6 text-gray-900 dark:text-gray-100 w-full xl:w-auto justify-between xl:justify-start">
              <div>
                <span className="text-xs font-bold block text-gray-400 uppercase tracking-wider mb-1">
                  {filters.purchased === 'true' ? 'Collection Value' : 'Wishlist Value'}
                </span>
                <span className="text-3xl text-indigo-600 dark:text-indigo-400 font-black tracking-tight">
                  {formatCurrency((games.summary?.total_value ?? games.data?.reduce((sum, game) => sum + (game.current_price || 0), 0)) || 0)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center justify-start xl:justify-end">
              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'gallery'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title="Gallery View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title="List View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Sort Controls */}
              <select
                value={`${filters.order_by}-${filters.direction}`}
                onChange={(e) => {
                  const [order_by, direction] = e.target.value.split('-');
                  handleFilterChange('order_by', order_by);
                  handleFilterChange('direction', direction);
                }}
                className="p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm cursor-pointer"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="current_price-desc">Highest Value</option>
                <option value="current_price-asc">Lowest Value</option>
                <option value="metascore-desc">Best Rated</option>
                <option value="metascore-asc">Worst Rated</option>
                <option value="released_at-desc">Latest Release</option>
                <option value="released_at-asc">Earliest Release</option>
              </select>

              <input
                type="text"
                placeholder="Search collection..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-2 sm:w-64 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
              />
              
              <select
                value={filters.platform_id}
                onChange={(e) => handleFilterChange('platform_id', e.target.value)}
                className="p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm w-full sm:w-auto cursor-pointer"
              >
                <option value="">All Platforms</option>
                {platforms.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.purchased}
                onChange={(e) => handleFilterChange('purchased', e.target.value)}
                className="p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm cursor-pointer"
              >
                <option value="true">Collection</option>
                <option value="false">Wishlist</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 m-2 p-2 md:m-0 md:p-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
              </div>
            ))}
          </div>
        ) : games.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No games found</h3>
            <p className="mb-6">Get started by adding games to your collection.</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
            >
              Add Your First Game
            </button>
          </div>
        ) : viewMode === 'gallery' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.data.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                viewMode="gallery" 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {games.data.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                viewMode="list" 
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {games.pagination && games.pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-8 px-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((games.pagination.current_page - 1) * games.pagination.per_page) + 1} to{' '}
              {Math.min(games.pagination.current_page * games.pagination.per_page, games.pagination.total)} of{' '}
              {games.pagination.total} games
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange('page', games.pagination.current_page - 1)}
                disabled={!games.pagination.has_prev}
                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, games.pagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (games.pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (games.pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (games.pagination.current_page >= games.pagination.total_pages - 2) {
                    pageNum = games.pagination.total_pages - 4 + i;
                  } else {
                    pageNum = games.pagination.current_page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                        pageNum === games.pagination.current_page
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handleFilterChange('page', games.pagination.current_page + 1)}
                disabled={!games.pagination.has_next}
                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {editingGame ? 'Edit Game' : 'Add New Game'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isBulk}
                      onChange={(e) => setIsBulk(e.target.checked)}
                      className="mr-2"
                      disabled={editingGame}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bulk Add</span>
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isBulk ? 'Titles (One per line)' : 'Title'}
                    </label>

                    {!isBulk && (
                      <>
                        <input
                          ref={scanFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleScanFileChange(e.target.files?.[0] || null)}
                        />
                        <button
                          type="button"
                          onClick={() => scanFileInputRef.current?.click()}
                          disabled={scanLoading}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                        >
                          {scanLoading ? 'Scanning...' : 'Scan from Image'}
                        </button>
                      </>
                    )}
                  </div>

                  {!isBulk && scanError && (
                    <div className="mb-2 text-sm text-red-600 dark:text-red-400">
                      {scanError}
                    </div>
                  )}

                  {isBulk ? (
                    <textarea
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                      rows="5"
                      placeholder="Game 1&#10;Game 2&#10;Game 3"
                      required
                    />
                  ) : (
                    <GameSearchAutocomplete
                      placeholder="Search for a game or enter manually..."
                      onSelect={(game) => {
                        setFormData(prev => ({
                          ...prev,
                          title: game.title,
                          image_url: game.image_url || '',
                          metascore: game.metascore || '',
                          released_at: game.released_at || '',
                          genres: game.genres || ''
                        }));
                      }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Platform
                    </label>
                    <select
                      value={formData.platform_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, platform_id: e.target.value }))}
                      className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                      required
                    >
                      <option value="">Select Platform</option>
                      {platforms.map(platform => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                    >
                      <option value="uncategorized">Uncategorized</option>
                      <option value="not_played">Not Played</option>
                      <option value="currently_playing">Currently Playing</option>
                      <option value="played">Played</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price Paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.current_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, current_price: e.target.value }))}
                      className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {!isBulk && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Upload Cover Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCoverFileChange(e.target.files?.[0] || null)}
                        className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Release Date
                        </label>
                        <input
                          type="date"
                          value={formData.released_at}
                          onChange={(e) => setFormData(prev => ({ ...prev, released_at: e.target.value }))}
                          className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Metascore
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.metascore}
                          onChange={(e) => setFormData(prev => ({ ...prev, metascore: e.target.value }))}
                          className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                          placeholder="85"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.rating}
                          onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                          className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                          placeholder="4.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Genres
                      </label>
                      <input
                        type="text"
                        value={formData.genres}
                        onChange={(e) => setFormData(prev => ({ ...prev, genres: e.target.value }))}
                        className="w-full p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                        placeholder="Action, Adventure, RPG"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.purchased}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchased: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Purchased (uncheck for wishlist)</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    {editingGame ? 'Update Game' : isBulk ? 'Add Games' : 'Add Game'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGame(null);
                      setIsBulk(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import from CSV</h2>
                <button
                  type="button"
                  onClick={downloadImportTemplate}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Download template
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CSV file
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => handleImportFileChange(e.target.files?.[0] || null)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Rows: {importSummary.totalRows} • Ready: {importSummary.ready} • Skipped: {importSummary.skipped}
                  </div>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={skipImportDuplicates}
                      onChange={(e) => setSkipImportDuplicates(e.target.checked)}
                      className="mr-2"
                    />
                    Skip duplicates
                  </label>
                </div>

                {importParseErrors.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="text-sm font-bold text-red-800 dark:text-red-300">Skipped rows</div>
                    <ul className="mt-2 text-sm text-red-700 dark:text-red-300 max-h-32 overflow-y-auto list-disc pl-5">
                      {importParseErrors.slice(0, 50).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importData.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-sm font-bold text-gray-700 dark:text-gray-200">
                      Preview (first 10)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white dark:bg-gray-800">
                          <tr className="text-left text-gray-500 dark:text-gray-400">
                            <th className="px-4 py-2">Title</th>
                            <th className="px-4 py-2">Platform</th>
                            <th className="px-4 py-2">Purchased</th>
                            <th className="px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {importData.slice(0, 10).map((g, i) => (
                            <tr key={i} className="text-gray-900 dark:text-gray-100">
                              <td className="px-4 py-2">{g.title}</td>
                              <td className="px-4 py-2">{platforms.find(p => String(p.id) === String(g.platform_id))?.name || g.platform_id}</td>
                              <td className="px-4 py-2">{g.purchased ? 'yes' : 'no'}</td>
                              <td className="px-4 py-2">{g.status || 'uncategorized'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={importLoading || importData.length === 0}
                    onClick={handleImportSubmit}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importLoading ? 'Importing…' : `Import ${importData.length} games`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      resetImport();
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLibrary;