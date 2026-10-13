import React, { lazy, Suspense } from "react";
import { I18nProvider } from "./i18n/I18nContext";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AccountSetup } from "./pages/AccountSetup";
import { About } from "./pages/About";
import { Dashboard } from "./pages/Dashboard";
import { Disclaimer } from "./pages/Disclaimer";
import { Feedback } from "./pages/Feedback";
import { HomeRoute } from "./pages/HomeRoute";
import { Login } from "./pages/Login";
import { NewReport } from "./pages/NewReport";
import { Preferences } from "./pages/Preferences";
import { Reports } from "./pages/Reports";
import { Signup } from "./pages/Signup";
const Workspace = lazy(() =>
  import("./pages/Workspace").then((m) => ({ default: m.Workspace })),
);
import "./styles.css";
import { Education } from "./education/Education";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
    <Suspense fallback={<p role="status">Loading RadRepPilot…</p>}>
      <HashRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/about" element={<About />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/feedback" element={<Feedback />} />
          </Route>
          <Route path="/learn/*" element={<Education />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:workspaceSection" element={<Workspace />} />
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
    </Suspense>
  </I18nProvider>
  </React.StrictMode>,
);
