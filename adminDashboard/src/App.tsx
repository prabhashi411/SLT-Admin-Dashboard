import { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import RegisterAgent from './pages/RegisterAgent';
import SettingsPage from './pages/Settings';

export default function App() {
  const [activeNav, setActiveNav] = useState('agents');
  const [view, setView] = useState<'dashboard' | 'register' | 'settings'>('dashboard');

  const handleRegisterAgent = () => setView('register');
  const handleBackToDashboard = () => setView('dashboard');

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    if (id === 'settings') {
      setView('settings');
    } else if (id === 'dashboard' || id === 'agents') {
      setView('dashboard');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeNav={activeNav} onNavChange={handleNavChange} />
      <div className="main-wrapper">
        <TopBar />
        <main className="main-content">
          {view === 'settings' ? (
            <SettingsPage />
          ) : view === 'dashboard' ? (
            <Dashboard onRegisterAgent={handleRegisterAgent} />
          ) : (
            <RegisterAgent onBack={handleBackToDashboard} />
          )}
        </main>
      </div>
    </div>
  );
}
