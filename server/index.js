import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { existsSync } from 'fs';
import { copyFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const BODY_LIMIT = process.env.BODY_LIMIT || '10mb';

// Middleware
const corsAllowlist = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      if (origin === 'http://localhost:5173' || origin === 'http://localhost:3000') {
        return callback(null, true);
      }
    }

    if (corsAllowlist.includes(origin)) return callback(null, true);

    if (origin.endsWith('.vercel.app')) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Database setup
const bundledDbPath = join(__dirname, 'database.sqlite');
const dbPath = process.env.VERCEL ? join('/tmp', 'database.sqlite') : bundledDbPath;

if (process.env.VERCEL && !existsSync(dbPath) && existsSync(bundledDbPath)) {
  try {
    await copyFile(bundledDbPath, dbPath);
  } catch (err) {
    console.error('Error copying bundled database to /tmp:', err);
  }
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Platforms table
  db.run(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Games table
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      platform_id INTEGER NOT NULL,
      price DECIMAL(10,2),
      current_price DECIMAL(10,2),
      price_source TEXT,
      purchase_location TEXT,
      purchased BOOLEAN DEFAULT 0,
      image_url TEXT,
      metascore INTEGER,
      released_at DATE,
      genres TEXT,
      rating DECIMAL(3,1),
      status TEXT DEFAULT 'uncategorized',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (platform_id) REFERENCES platforms (id)
    )
  `);

  // Add notes column if it doesn't exist (migration)
  db.run(`
    ALTER TABLE games ADD COLUMN notes TEXT
  `, (err) => {
    // Ignore error if column already exists
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding notes column:', err);
    }
  });

  // Collections table
  db.run(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Reviews table
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      rating DECIMAL(3,1),
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id)
    )
  `);

  // Price history table
  db.run(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      platform_name TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      url TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id)
    )
  `);

  // Price alerts table
  db.run(`
    CREATE TABLE IF NOT EXISTS price_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      target_price DECIMAL(10,2),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id)
    )
  `);

  // Price alert notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS price_alert_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      old_price DECIMAL(10,2),
      new_price DECIMAL(10,2) NOT NULL,
      platform_name TEXT NOT NULL,
      url TEXT,
      seen BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games (id)
    )
  `);

  // Milestones table
  db.run(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      threshold INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      unlocked BOOLEAN DEFAULT 0,
      seen BOOLEAN DEFAULT 0,
      unlocked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed platforms
  const platforms = [
    { name: 'PlayStation 5', slug: 'ps5' },
    { name: 'PlayStation 4', slug: 'ps4' },
    { name: 'PlayStation 3', slug: 'ps3' },
    { name: 'PlayStation 2', slug: 'ps2' },
    { name: 'PlayStation', slug: 'ps1' },
    { name: 'PS Vita', slug: 'ps-vita' },
    { name: 'Xbox Series S/X', slug: 'xbox-series-x' },
    { name: 'Xbox 360', slug: 'xbox-360' },
    { name: 'PC', slug: 'pc' },
    { name: 'Nintendo DS', slug: 'nintendo-ds' },
    { name: 'Nintendo GameCube', slug: 'nintendo-gamecube' },
    { name: 'Wii', slug: 'wii' },
    { name: 'Wii U', slug: 'wii-u' },
    { name: 'Nintendo Switch', slug: 'switch' },
  ];

  platforms.forEach(platform => {
    db.run(
      'INSERT OR IGNORE INTO platforms (name, slug) VALUES (?, ?)',
      [platform.name, platform.slug]
    );
  });

  // Seed milestones
  const milestones = [
    // Game Count Milestones
    { type: 'games', threshold: 1, title: 'First Game', description: 'Added your first game to the collection', icon: '🎮', color: 'bg-green-500' },
    { type: 'games', threshold: 10, title: 'Getting Started', description: 'Reached 10 games in your collection', icon: '📚', color: 'bg-blue-500' },
    { type: 'games', threshold: 25, title: 'Growing Collection', description: 'Reached 25 games in your collection', icon: '📦', color: 'bg-purple-500' },
    { type: 'games', threshold: 50, title: 'Serious Collector', description: 'Reached 50 games in your collection', icon: '🏆', color: 'bg-yellow-500' },
    { type: 'games', threshold: 100, title: 'Century Club', description: 'Reached 100 games in your collection', icon: '💯', color: 'bg-orange-500' },
    { type: 'games', threshold: 250, title: 'Master Collector', description: 'Reached 250 games in your collection', icon: '👑', color: 'bg-red-500' },
    { type: 'games', threshold: 500, title: 'Legendary Collection', description: 'Reached 500 games in your collection', icon: '⭐', color: 'bg-indigo-500' },
    { type: 'games', threshold: 1000, title: 'Ultimate Collector', description: 'Reached 1000 games in your collection', icon: '🌟', color: 'bg-pink-500' },
    
    // Value Milestones (in pence for SQLite)
    { type: 'value', threshold: 10000, title: 'First £100', description: 'Collection worth £100', icon: '💷', color: 'bg-green-500' },
    { type: 'value', threshold: 50000, title: 'Half Grand', description: 'Collection worth £500', icon: '💰', color: 'bg-blue-500' },
    { type: 'value', threshold: 100000, title: 'Grand Collection', description: 'Collection worth £1,000', icon: '💎', color: 'bg-purple-500' },
    { type: 'value', threshold: 500000, title: 'High Roller', description: 'Collection worth £5,000', icon: '🏦', color: 'bg-yellow-500' },
    { type: 'value', threshold: 1000000, title: 'Treasure Trove', description: 'Collection worth £10,000', icon: '🏰', color: 'bg-orange-500' },
    
    // Completion Milestones
    { type: 'completed', threshold: 1, title: 'First Completion', description: 'Completed your first game', icon: '✅', color: 'bg-green-500' },
    { type: 'completed', threshold: 5, title: 'Getting Things Done', description: 'Completed 5 games', icon: '🎯', color: 'bg-blue-500' },
    { type: 'completed', threshold: 10, title: 'Finisher', description: 'Completed 10 games', icon: '🏁', color: 'bg-purple-500' },
    { type: 'completed', threshold: 25, title: 'Completionist', description: 'Completed 25 games', icon: '🏅', color: 'bg-yellow-500' },
    { type: 'completed', threshold: 50, title: 'Achievement Hunter', description: 'Completed 50 games', icon: '🎖️', color: 'bg-orange-500' },
    { type: 'completed', threshold: 100, title: 'Master Finisher', description: 'Completed 100 games', icon: '👑', color: 'bg-red-500' },
    
    // Platform Milestones
    { type: 'platforms', threshold: 3, title: 'Multi-Platform', description: 'Games on 3 different platforms', icon: '🎮', color: 'bg-green-500' },
    { type: 'platforms', threshold: 5, title: 'Platform Explorer', description: 'Games on 5 different platforms', icon: '🗺️', color: 'bg-blue-500' },
    { type: 'platforms', threshold: 10, title: 'Platform Master', description: 'Games on 10 different platforms', icon: '🌍', color: 'bg-purple-500' }
  ];

  milestones.forEach(milestone => {
    db.run(
      'INSERT OR IGNORE INTO milestones (type, threshold, title, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
      [milestone.type, milestone.threshold, milestone.title, milestone.description, milestone.icon, milestone.color]
    );
  });
});

// API Routes

// Get all platforms
app.get('/api/platforms', (req, res) => {
  db.all('SELECT * FROM platforms ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get all games with pagination and filters
app.get('/api/games', (req, res) => {
  const {
    search = '',
    platform_id = '',
    status = 'all',
    purchased = 'true',
    order_by = 'created_at',
    direction = 'desc',
    page = 1,
    per_page = 24
  } = req.query;

  let query = `
    SELECT g.*, p.name as platform_name, p.slug as platform_slug
    FROM games g
    LEFT JOIN platforms p ON g.platform_id = p.id
    WHERE 1=1
  `;
  const params = [];

  // Apply filters
  if (search) {
    query += ' AND g.title LIKE ?';
    params.push(`%${search}%`);
  }

  if (platform_id) {
    query += ' AND g.platform_id = ?';
    params.push(platform_id);
  }

  if (status !== 'all') {
    query += ' AND g.status = ?';
    params.push(status);
  }

  if (purchased !== 'all') {
    const isPurchased = purchased === 'true' ? 1 : 0;
    query += ' AND g.purchased = ?';
    params.push(isPurchased);
  }

  // Apply sorting
  const validSortFields = ['title', 'price', 'current_price', 'metascore', 'released_at', 'created_at'];
  const sortField = validSortFields.includes(order_by) ? order_by : 'created_at';
  const sortDirection = direction === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY g.${sortField} ${sortDirection}`;

  // Apply pagination
  const limit = per_page === 'all' ? 1000 : parseInt(per_page);
  const offset = (parseInt(page) - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM games g
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ' AND g.title LIKE ?';
      countParams.push(`%${search}%`);
    }

    if (platform_id) {
      countQuery += ' AND g.platform_id = ?';
      countParams.push(platform_id);
    }

    if (status !== 'all') {
      countQuery += ' AND g.status = ?';
      countParams.push(status);
    }

    if (purchased !== 'all') {
      const isPurchased = purchased === 'true' ? 1 : 0;
      countQuery += ' AND g.purchased = ?';
      countParams.push(isPurchased);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      let valueQuery = `
        SELECT COALESCE(SUM(COALESCE(g.current_price, 0)), 0) as total_value
        FROM games g
        WHERE 1=1
      `;
      const valueParams = [];

      if (search) {
        valueQuery += ' AND g.title LIKE ?';
        valueParams.push(`%${search}%`);
      }

      if (platform_id) {
        valueQuery += ' AND g.platform_id = ?';
        valueParams.push(platform_id);
      }

      if (status !== 'all') {
        valueQuery += ' AND g.status = ?';
        valueParams.push(status);
      }

      if (purchased !== 'all') {
        const isPurchased = purchased === 'true' ? 1 : 0;
        valueQuery += ' AND g.purchased = ?';
        valueParams.push(isPurchased);
      }

      db.get(valueQuery, valueParams, (err, valueResult) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          data: rows.map(row => ({
            ...row,
            platform: {
              id: row.platform_id,
              name: row.platform_name,
              slug: row.platform_slug
            }
          })),
          pagination: {
            current_page: parseInt(page),
            per_page: limit,
            total,
            total_pages: totalPages,
            has_next: parseInt(page) < totalPages,
            has_prev: parseInt(page) > 1
          },
          summary: {
            total_value: valueResult?.total_value || 0
          }
        });
      });
    });
  });
});

// Get game statistics
app.get('/api/games/statistics', (req, res) => {
  const stats = {};

  // Get total games and value
  db.get('SELECT COUNT(*) as total_games, SUM(current_price) as total_value FROM games', (err, totals) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    stats.totalGames = totals.total_games || 0;
    stats.totalValue = totals.total_value || 0;

    // Get platform breakdown
    db.all(`
      SELECT p.name as platform_name, COUNT(*) as count, SUM(g.current_price) as total_value
      FROM games g
      LEFT JOIN platforms p ON g.platform_id = p.id
      GROUP BY g.platform_id, p.name
      ORDER BY total_value DESC
    `, (err, platforms) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      stats.platforms = platforms || [];

      // Get status breakdown
      db.all(`
        SELECT status, COUNT(*) as count
        FROM games
        GROUP BY status
        ORDER BY count DESC
      `, (err, statuses) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        stats.statuses = statuses || [];

        // Get top valued games
        db.all(`
          SELECT g.*, p.name as platform_name
          FROM games g
          LEFT JOIN platforms p ON g.platform_id = p.id
          WHERE g.current_price IS NOT NULL
          ORDER BY g.current_price DESC
          LIMIT 5
        `, (err, topValued) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          stats.topValued = topValued.map(game => ({
            ...game,
            platform: { name: game.platform_name }
          })) || [];

          res.json(stats);
        });
      });
    });
  });
});

// Get dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as totalGames,
      SUM(CASE WHEN purchased = 1 THEN current_price ELSE 0 END) as totalValue,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM games
  `, (err, stats) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(stats || { totalGames: 0, totalValue: 0, completed: 0 });
  });
});

// Get recent games for dashboard
app.get('/api/dashboard/recent', (req, res) => {
  db.all(`
    SELECT g.*, p.name as platform_name, p.slug as platform_slug
    FROM games g
    LEFT JOIN platforms p ON g.platform_id = p.id
    ORDER BY g.created_at DESC
    LIMIT 8
  `, (err, games) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const formattedGames = games.map(game => ({
      ...game,
      platform: {
        id: game.platform_id,
        name: game.platform_name,
        slug: game.platform_slug
      }
    }));
    
    res.json(formattedGames);
  });
});

// Create a new game
app.post('/api/games', (req, res) => {
  const {
    title,
    platform_id,
    price,
    current_price,
    price_source,
    purchase_location,
    purchased = false,
    image_url,
    metascore,
    released_at,
    genres,
    rating,
    status = 'uncategorized',
    notes
  } = req.body;

  db.run(`
    INSERT INTO games (
      title, platform_id, price, current_price, price_source, purchase_location,
      purchased, image_url, metascore, released_at, genres, rating, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    title, platform_id, price, current_price, price_source, purchase_location,
    purchased ? 1 : 0, image_url, metascore, released_at, genres, rating, status, notes
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Game created successfully' });
  });
});

// Bulk create games
app.post('/api/games/bulk', (req, res) => {
  const { games } = req.body;
  
  if (!Array.isArray(games)) {
    res.status(400).json({ error: 'Games must be an array' });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO games (
      title, platform_id, price, current_price, purchase_location, purchased
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  games.forEach(game => {
    stmt.run([
      game.title,
      game.platform_id,
      game.price,
      game.current_price,
      game.purchase_location,
      game.purchased ? 1 : 0
    ], (err) => {
      if (!err) count++;
    });
  });

  stmt.finalize(() => {
    res.json({ message: `${count} games created successfully` });
  });
});

// Update a game
app.put('/api/games/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    platform_id,
    price,
    current_price,
    price_source,
    purchase_location,
    purchased,
    image_url,
    metascore,
    released_at,
    genres,
    rating,
    status,
    notes
  } = req.body;

  db.run(`
    UPDATE games SET
      title = ?, platform_id = ?, price = ?, current_price = ?, price_source = ?,
      purchase_location = ?, purchased = ?, image_url = ?, metascore = ?,
      released_at = ?, genres = ?, rating = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    title, platform_id, price, current_price, price_source, purchase_location,
    purchased ? 1 : 0, image_url, metascore, released_at, genres, rating, status, notes, id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Game updated successfully' });
  });
});

// Delete a game
app.delete('/api/games/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM games WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Game deleted successfully' });
  });
});

const getRawgSearchUrl = (query, pageSize = 10) => {
  const base = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=${pageSize}`;
  const key = process.env.RAWG_API_KEY;
  return key ? `${base}&key=${encodeURIComponent(key)}` : base;
};

const sanitizeTitleForSearch = (title) => {
  if (!title) return '';

  return String(title)
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+-\s+.+$/g, ' ')
    .replace(/[:|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const mapRawgGameToMetadata = (game) => ({
  id: game.id,
  title: game.name,
  image_url: game.background_image,
  released_at: game.released,
  genres: game.genres?.map(g => g.name).join(', '),
  metascore: game.metacritic,
  platforms: game.platforms?.map(p => p.platform.name)
});

// Search game metadata from RAWG API
app.get('/api/games/search-metadata', async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await fetch(getRawgSearchUrl(query, 10));
    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: data?.detail || 'Failed to fetch game metadata' });
    }
    
    const games = data.results?.map(mapRawgGameToMetadata) || [];

    res.json({ games });
  } catch (error) {
    console.error('Error fetching game metadata:', error);
    res.status(500).json({ error: 'Failed to fetch game metadata' });
  }
});

// Refresh metadata for a stored game
app.post('/api/games/:id/refresh-metadata', (req, res) => {
  const { id } = req.params;

  db.get('SELECT id, title FROM games WHERE id = ?', [id], async (err, game) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    try {
      const query = sanitizeTitleForSearch(game.title);
      const response = await fetch(getRawgSearchUrl(query || game.title, 5));
      const data = await response.json();

      if (!response.ok) {
        res.status(502).json({ error: data?.detail || 'Failed to refresh game metadata' });
        return;
      }

      const match = data.results?.[0];
      if (!match) {
        res.json({ metadata: null, message: 'No metadata match found' });
        return;
      }

      const metadata = mapRawgGameToMetadata(match);

      db.run(`
        UPDATE games SET
          image_url = ?, released_at = ?, genres = ?, metascore = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        metadata.image_url,
        metadata.released_at,
        metadata.genres,
        metadata.metascore,
        id
      ], function(updateErr) {
        if (updateErr) {
          res.status(500).json({ error: updateErr.message });
          return;
        }

        res.json({ metadata });
      });
    } catch (error) {
      console.error('Error refreshing game metadata:', error);
      res.status(500).json({ error: 'Failed to refresh game metadata' });
    }
  });
});

// Get game by ID with price history
app.get('/api/games/:id', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT g.*, p.name as platform_name, p.slug as platform_slug
    FROM games g
    LEFT JOIN platforms p ON g.platform_id = p.id
    WHERE g.id = ?
  `, [id], (err, game) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Get price history
    db.all(`
      SELECT platform_name, price, url, checked_at
      FROM price_history
      WHERE game_id = ?
      ORDER BY checked_at DESC
    `, [id], (err, priceHistory) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        ...game,
        platform: {
          id: game.platform_id,
          name: game.platform_name,
          slug: game.platform_slug
        },
        price_history: priceHistory || []
      });
    });
  });
});

const generateMockPrices = () => [
  {
    platform: 'Steam',
    price: Math.floor(Math.random() * 50) + 10,
    url: 'https://store.steampowered.com',
    last_checked: new Date().toISOString()
  },
  {
    platform: 'GOG',
    price: Math.floor(Math.random() * 45) + 12,
    url: 'https://www.gog.com',
    last_checked: new Date().toISOString()
  },
  {
    platform: 'PlayStation Store',
    price: Math.floor(Math.random() * 60) + 15,
    url: 'https://store.playstation.com',
    last_checked: new Date().toISOString()
  },
  {
    platform: 'eBay',
    price: Math.floor(Math.random() * 30) + 8,
    url: 'https://www.ebay.com',
    last_checked: new Date().toISOString()
  }
];

const storePriceHistory = (gameId, prices, callback) => {
  const stmt = db.prepare(`
    INSERT INTO price_history (game_id, platform_name, price, url)
    VALUES (?, ?, ?, ?)
  `);

  prices.forEach(priceData => {
    stmt.run([gameId, priceData.platform, priceData.price, priceData.url]);
  });

  stmt.finalize(callback);
};

// Get current prices for a game across platforms
app.get('/api/games/:id/prices', (req, res) => {
  const { id } = req.params;

  const mockPrices = generateMockPrices();

  storePriceHistory(id, mockPrices, () => {
    res.json({ prices: mockPrices });
  });
});

// Refresh prices for a stored game (also updates current_price and price_source)
app.post('/api/games/:id/refresh-prices', (req, res) => {
  const { id } = req.params;

  db.get('SELECT id FROM games WHERE id = ?', [id], (err, game) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const prices = generateMockPrices();

    storePriceHistory(id, prices, () => {
      const lowest = prices.reduce((best, p) => (!best || p.price < best.price ? p : best), null);

      db.run(`
        UPDATE games SET
          current_price = ?, price_source = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [lowest?.price ?? null, lowest?.platform ?? null, id], function(updateErr) {
        if (updateErr) {
          res.status(500).json({ error: updateErr.message });
          return;
        }

        res.json({ prices, current_price: lowest?.price ?? null, price_source: lowest?.platform ?? null });
      });
    });
  });
});

// Bulk delete games
app.delete('/api/games/bulk', (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  const placeholders = ids.map(() => '?').join(',');
  
  db.run(`DELETE FROM games WHERE id IN (${placeholders})`, ids, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `${this.changes} games deleted successfully` });
  });
});

// Check for duplicate games
app.get('/api/games/check-duplicate', (req, res) => {
  const { title, platform_id } = req.query;
  
  if (!title || !platform_id) {
    return res.status(400).json({ error: 'Title and platform_id are required' });
  }

  db.all(`
    SELECT g.*, p.name as platform_name
    FROM games g
    LEFT JOIN platforms p ON g.platform_id = p.id
    WHERE LOWER(g.title) = LOWER(?) AND g.platform_id = ?
  `, [title, platform_id], (err, duplicates) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      duplicates: duplicates.map(game => ({
        ...game,
        platform: { name: game.platform_name }
      }))
    });
  });
});

// Import games from JSON
app.post('/api/games/import', (req, res) => {
  const { games, skipDuplicates = true } = req.body;
  
  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'Games array is required' });
  }

  const stmt = db.prepare(`
    INSERT INTO games (
      title, platform_id, price, current_price, price_source, purchase_location,
      purchased, image_url, metascore, released_at, genres, rating, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  let errors = 0;
  let duplicatesSkipped = 0;
  const duplicatesList = [];

  // Check for duplicates first if skipDuplicates is enabled
  const processGame = (game, callback) => {
    if (skipDuplicates) {
      db.get(`
        SELECT id, title FROM games 
        WHERE LOWER(title) = LOWER(?) AND platform_id = ?
      `, [game.title, game.platform_id], (err, existing) => {
        if (err) {
          callback(err);
          return;
        }
        
        if (existing) {
          duplicatesSkipped++;
          duplicatesList.push({
            title: game.title,
            platform_id: game.platform_id,
            existing_id: existing.id
          });
          callback(null, 'duplicate');
          return;
        }
        
        // No duplicate found, insert the game
        stmt.run([
          game.title,
          game.platform_id,
          game.price,
          game.current_price,
          game.price_source,
          game.purchase_location,
          game.purchased ? 1 : 0,
          game.image_url,
          game.metascore,
          game.released_at,
          game.genres,
          game.rating,
          game.status || 'uncategorized',
          game.notes
        ], (err) => {
          if (err) {
            callback(err);
          } else {
            count++;
            callback(null, 'inserted');
          }
        });
      });
    } else {
      // Skip duplicate check, just insert
      stmt.run([
        game.title,
        game.platform_id,
        game.price,
        game.current_price,
        game.price_source,
        game.purchase_location,
        game.purchased ? 1 : 0,
        game.image_url,
        game.metascore,
        game.released_at,
        game.genres,
        game.rating,
        game.status || 'uncategorized',
        game.notes
      ], (err) => {
        if (err) {
          callback(err);
        } else {
          count++;
          callback(null, 'inserted');
        }
      });
    }
  };

  // Process games sequentially
  let processed = 0;
  const processNext = () => {
    if (processed >= games.length) {
      stmt.finalize(() => {
        res.json({ 
          message: `Import completed: ${count} games imported successfully${errors > 0 ? `, ${errors} errors` : ''}${duplicatesSkipped > 0 ? `, ${duplicatesSkipped} duplicates skipped` : ''}`,
          imported: count,
          errors,
          duplicatesSkipped,
          duplicates: duplicatesList
        });
      });
      return;
    }

    const game = games[processed];
    processGame(game, (err, result) => {
      if (err && result !== 'duplicate') {
        errors++;
      }
      processed++;
      processNext();
    });
  };

  processNext();
});

// Price Alerts API Routes

// Get all price alerts
app.get('/api/price-alerts', (req, res) => {
  db.all(`
    SELECT pa.*, g.title, g.image_url, g.current_price, p.name as platform_name
    FROM price_alerts pa
    LEFT JOIN games g ON pa.game_id = g.id
    LEFT JOIN platforms p ON g.platform_id = p.id
    WHERE pa.is_active = 1
    ORDER BY pa.created_at DESC
  `, (err, alerts) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(alerts || []);
  });
});

// Create a price alert
app.post('/api/price-alerts', (req, res) => {
  const { game_id, target_price } = req.body;
  
  if (!game_id) {
    return res.status(400).json({ error: 'game_id is required' });
  }

  // Check if alert already exists
  db.get('SELECT id FROM price_alerts WHERE game_id = ? AND is_active = 1', [game_id], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (existing) {
      return res.status(400).json({ error: 'Price alert already exists for this game' });
    }

    db.run(`
      INSERT INTO price_alerts (game_id, target_price)
      VALUES (?, ?)
    `, [game_id, target_price], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Price alert created successfully' });
    });
  });
});

// Update a price alert
app.put('/api/price-alerts/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { target_price, is_active } = req.body;

  db.run(`
    UPDATE price_alerts SET
      target_price = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE game_id = ?
  `, [target_price, is_active ? 1 : 0, gameId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Price alert updated successfully' });
  });
});

// Delete a price alert
app.delete('/api/price-alerts/:gameId', (req, res) => {
  const { gameId } = req.params;

  db.run('DELETE FROM price_alerts WHERE game_id = ?', [gameId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Price alert deleted successfully' });
  });
});

// Get price alert notifications
app.get('/api/price-alerts/notifications', (req, res) => {
  db.all(`
    SELECT pan.*, g.title, g.image_url, p.name as platform_name
    FROM price_alert_notifications pan
    LEFT JOIN games g ON pan.game_id = g.id
    LEFT JOIN platforms p ON g.platform_id = p.id
    ORDER BY pan.created_at DESC
    LIMIT 50
  `, (err, notifications) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(notifications || []);
  });
});

// Mark notification as seen
app.put('/api/price-alerts/notifications/:id/seen', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE price_alert_notifications SET seen = 1 WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Notification marked as seen' });
  });
});

// Check prices for all alerted games
app.post('/api/price-alerts/check', (req, res) => {
  // Get all active price alerts with game info
  db.all(`
    SELECT pa.*, g.title, g.current_price, g.purchased
    FROM price_alerts pa
    LEFT JOIN games g ON pa.game_id = g.id
    WHERE pa.is_active = 1 AND g.purchased = 0
  `, (err, alerts) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (alerts.length === 0) {
      return res.json({ message: 'No active price alerts found', notifications: 0 });
    }

    let notificationsCreated = 0;
    let processed = 0;

    alerts.forEach(alert => {
      // Generate mock price data for each alert
      const mockPrices = [
        {
          platform: 'Steam',
          price: Math.floor(Math.random() * 50) + 10,
          url: 'https://store.steampowered.com'
        },
        {
          platform: 'GOG',
          price: Math.floor(Math.random() * 45) + 12,
          url: 'https://www.gog.com'
        },
        {
          platform: 'PlayStation Store',
          price: Math.floor(Math.random() * 60) + 15,
          url: 'https://store.playstation.com'
        }
      ];

      mockPrices.forEach(priceData => {
        const oldPrice = alert.current_price || alert.target_price;
        const newPrice = priceData.price;
        
        // Check if price dropped
        const shouldAlert = alert.target_price 
          ? newPrice < alert.target_price 
          : oldPrice && newPrice < oldPrice * 0.8; // 20% drop if no target price

        if (shouldAlert) {
          // Create notification
          db.run(`
            INSERT INTO price_alert_notifications (game_id, old_price, new_price, platform_name, url)
            VALUES (?, ?, ?, ?, ?)
          `, [alert.game_id, oldPrice, newPrice, priceData.platform, priceData.url], (err) => {
            if (!err) {
              notificationsCreated++;
            }
          });
        }

        // Update price history
        db.run(`
          INSERT INTO price_history (game_id, platform_name, price, url)
          VALUES (?, ?, ?, ?)
        `, [alert.game_id, priceData.platform, newPrice, priceData.url]);
      });

      processed++;
      if (processed === alerts.length) {
        setTimeout(() => {
          res.json({ 
            message: `Price check completed for ${alerts.length} games`,
            notifications: notificationsCreated
          });
        }, 100);
      }
    });
  });
});

// Get unseen notifications count
app.get('/api/price-alerts/notifications/count', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM price_alert_notifications WHERE seen = 0', (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ count: result.count || 0 });
  });
});

// Milestones API Routes

// Get all milestones
app.get('/api/milestones', (req, res) => {
  db.all('SELECT * FROM milestones ORDER BY type, threshold', (err, milestones) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(milestones || []);
  });
});

// Check and update milestones based on current stats
app.post('/api/milestones/check', (req, res) => {
  // Get current stats
  db.get(`
    SELECT 
      COUNT(*) as totalGames,
      SUM(CASE WHEN purchased = 1 THEN current_price ELSE 0 END) * 100 as totalValue,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      COUNT(DISTINCT platform_id) as platforms
    FROM games
  `, (err, stats) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const currentStats = {
      games: stats.totalGames || 0,
      value: Math.round(stats.totalValue || 0), // Convert to pence
      completed: stats.completed || 0,
      platforms: stats.platforms || 0
    };

    // Get all milestones
    db.all('SELECT * FROM milestones', (err, milestones) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const newlyUnlocked = [];
      const updatePromises = [];

      milestones.forEach(milestone => {
        const currentValue = currentStats[milestone.type];
        const shouldBeUnlocked = currentValue >= milestone.threshold;
        
        if (shouldBeUnlocked && !milestone.unlocked) {
          // Newly unlocked milestone
          newlyUnlocked.push(milestone);
          
          updatePromises.push(new Promise((resolve, reject) => {
            db.run(
              'UPDATE milestones SET unlocked = 1, unlocked_at = CURRENT_TIMESTAMP WHERE id = ?',
              [milestone.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          }));
        }
      });

      // Execute all updates
      Promise.all(updatePromises)
        .then(() => {
          res.json({
            newlyUnlocked: newlyUnlocked.map(m => ({
              ...m,
              unlocked: true,
              unlocked_at: new Date().toISOString()
            })),
            currentStats
          });
        })
        .catch(err => {
          res.status(500).json({ error: err.message });
        });
    });
  });
});

// Mark milestone as seen
app.put('/api/milestones/:id/seen', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE milestones SET seen = 1 WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Milestone marked as seen' });
  });
});

// Get unseen milestones count
app.get('/api/milestones/unseen/count', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM milestones WHERE unlocked = 1 AND seen = 0', (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ count: result.count || 0 });
  });
});

// Start server (local dev only)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Game Collector API running on http://localhost:${PORT}`);
  });
}

export default app;
