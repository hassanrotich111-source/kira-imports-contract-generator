import { HashRouter, Routes, Route } from "react-router";
import Dashboard from "./pages/Dashboard";
import NewContract from "./pages/NewContract";
import EditContract from "./pages/EditContract";
import Preview from "./pages/Preview";
import History from "./pages/History";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewContract />} />
        <Route path="/edit/:id" element={<EditContract />} />
        <Route path="/preview/:id" element={<Preview />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  );
}
