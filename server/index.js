import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app.vercel.app'] // Replace with your actual Vercel domain
    : ['http://localhost:5173', 'http://localhost:3000']
}));
app.use(express.json());

// Database setup
const db = new sqlite3.Database(join(__dirname, 'database.sqlite'));

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
        }
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

// Search game metadata from RAWG API
app.get('/api/games/search-metadata', async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=10`);
    const data = await response.json();
    
    const games = data.results?.map(game => ({
      id: game.id,
      title: game.name,
      image_url: game.background_image,
      released_at: game.released,
      genres: game.genres?.map(g => g.name).join(', '),
      metascore: game.metacritic,
      platforms: game.platforms?.map(p => p.platform.name)
    })) || [];

    res.json({ games });
  } catch (error) {
    console.error('Error fetching game metadata:', error);
    res.status(500).json({ error: 'Failed to fetch game metadata' });
  }
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

// Get current prices for a game across platforms
app.get('/api/games/:id/prices', (req, res) => {
  const { id } = req.params;

  // Mock price data - in real implementation, this would call actual APIs
  const mockPrices = [
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

  // Store price history
  const stmt = db.prepare(`
    INSERT INTO price_history (game_id, platform_name, price, url)
    VALUES (?, ?, ?, ?)
  `);

  mockPrices.forEach(priceData => {
    stmt.run([id, priceData.platform, priceData.price, priceData.url]);
  });

  stmt.finalize(() => {
    res.json({ prices: mockPrices });
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Game Collector API running on http://localhost:${PORT}`);
});
