import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GameLibrary from './pages/GameLibrary';
import GameDetail from './pages/GameDetail';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import PriceAlerts from './pages/PriceAlerts';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<GameLibrary />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/price-alerts" element={<PriceAlerts />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
