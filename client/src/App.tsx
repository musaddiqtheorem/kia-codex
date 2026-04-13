import { Link, Route, Routes } from 'react-router-dom';
import AIInsightsPage from './pages/AIInsightsPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';

const App = () => (
  <div className="container">
    <header>
      <h1>Email Analytics Platform</h1>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/ai">AI Insights</Link>
      </nav>
    </header>
    <main>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/ai" element={<AIInsightsPage />} />
      </Routes>
    </main>
  </div>
);

export default App;
