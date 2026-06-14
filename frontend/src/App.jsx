/**
 * OODA — App Root
 * Phase 8: Responsive layout with desktop sidebar + mobile bottom nav.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SideNav from './components/SideNav';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Signals from './pages/Signals';
import Debate from './pages/Debate';
import CounterStrike from './pages/CounterStrike';
import Rivals from './pages/Rivals';
import EntropyPage from './pages/EntropyPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="ooda-grid-bg scan-line app-layout">
        {/* Desktop Sidebar */}
        <SideNav />

        {/* Main Content Area */}
        <main className="app-main">
          <div className="content-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/entropy" element={<EntropyPage />} />
              <Route path="/debate" element={<Debate />} />
              <Route path="/counter-strike" element={<CounterStrike />} />
              <Route path="/rivals" element={<Rivals />} />
            </Routes>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
