import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { HistoryPage } from './pages/History';
import { NotFoundPage } from './pages/NotFound';
import { NotesPage } from './pages/Notes';
import { SignInPage } from './pages/SignIn';
import { TodayPage } from './pages/Today';

export function AppRoutes() {
  const { ready, user, configured } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          !ready ? (
            <p className="status">Checking your session…</p>
          ) : user || !configured ? (
            <Navigate to="/today" replace />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
      <Route path="/today" element={<TodayPage />} />
      <Route path="/notes" element={<NotesPage />} />
      <Route path="/notes/:id" element={<NotesPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
