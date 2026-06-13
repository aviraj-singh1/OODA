/**
 * OODA — App Root
 * Observe → Orient → Decide → Act
 * Phase 2: Added /entropy route.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
      <div className="ooda-grid-bg scan-line min-h-screen flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 px-4 pt-5 pb-24 max-w-2xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/entropy" element={<EntropyPage />} />
            <Route path="/debate" element={<Debate />} />
            <Route path="/counter-strike" element={<CounterStrike />} />
            <Route path="/rivals" element={<Rivals />} />
          </Routes>
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
