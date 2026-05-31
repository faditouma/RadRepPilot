import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { Disclaimer } from './pages/Disclaimer';
import { Feedback } from './pages/Feedback';
import { Login } from './pages/Login';
import { NewReport } from './pages/NewReport';
import { Preferences } from './pages/Preferences';
import { Reports } from './pages/Reports';
import { Signup } from './pages/Signup';
import './styles.css';

function getRouterBasename() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.startsWith('/RadRepPilot') ? '/RadRepPilot' : '/';
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={getRouterBasename()}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<App />} />
          <Route path="/about" element={<About />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/new" element={<NewReport />} />
            <Route path="/preferences" element={<Preferences />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
