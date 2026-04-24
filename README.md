# Game Collector - React Edition

A modern, responsive React application for managing your video game collection. Track your games, organize by platform, and monitor your collection's value.

## 🚀 Features

- **Library Management**: Add, edit, and organize your game collection
- **Gallery & List Views**: Switch between visual gallery and detailed list views
- **Advanced Filtering**: Filter by platform, status (completed, playing, wishlist, etc.)
- **Search**: Find games quickly by title
- **Bulk Add**: Add multiple games at once
- **Statistics**: View detailed breakdowns of your collection
- **Responsive Design**: Fully optimized for desktop and mobile
- **Dark Mode**: Beautiful dark theme support

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Routing**: React Router

## ⚙️ Installation & Setup

1. **Clone and navigate to the project**
   ```bash
   cd game-collector
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

This will start both the React frontend (http://localhost:5173) and the Express API (http://localhost:3001) concurrently.

## 🎮 Usage

1. **Add Games**: Click "Add Game" to add individual games or use "Bulk Add" for multiple games
2. **Organize**: Set status (Uncategorized, Currently Playing, Completed, Played, Not Played)
3. **Track Value**: Add purchase price and current market value
4. **Filter & Search**: Use the sidebar filters and search to find specific games
5. **View Statistics**: Check the Statistics page for detailed collection insights

## 📊 Game Data Fields

- **Title**: Game name
- **Platform**: Gaming platform (PS5, PC, Switch, etc.)
- **Status**: Playing status
- **Price Paid**: What you paid for the game
- **Current Value**: Current market value
- **Image URL**: Cover art image
- **Release Date**: When the game was released
- **Metascore**: Metacritic score (0-100)
- **Rating**: User rating (0-5)
- **Genres**: Game genres (comma-separated)
- **Purchased**: Whether you own it or it's on your wishlist

## 🗂️ Project Structure

```
game-collector/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── GameLibrary.jsx
│   │   └── Statistics.jsx
│   ├── utils/
│   │   └── api.js
│   └── App.jsx
├── server/
│   ├── index.js          # Express API server
│   ├── database.sqlite   # SQLite database (auto-created)
│   └── package.json
└── package.json
```

## 📄 License

This project is open-sourced software licensed under the MIT license.