import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { AccountSetup } from './pages/AccountSetup';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { Disclaimer } from './pages/Disclaimer';
import { Feedback } from './pages/Feedback';
import { HomeRoute } from './pages/HomeRoute';
import { Login } from './pages/Login';
import { NewReport } from './pages/NewReport';
import { Preferences } from './pages/Preferences';
import { Reports } from './pages/Reports';
import { Signup } from './pages/Signup';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/about" element={<About />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/account-setup" element={<AccountSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/new" element={<NewReport />} />
            <Route path="/preferences" element={<Preferences />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
