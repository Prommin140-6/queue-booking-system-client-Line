import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import CheckStatusPage from './pages/CheckStatusPage';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdminAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/check-status" element={<CheckStatusPage />} />
        <Route
          path="/admin/login"
          element={isAdminAuthenticated ? <Navigate to="/admin" /> : <LoginPage />}
        />
        <Route
          path="/admin"
          element={isAdminAuthenticated ? <AdminPage /> : <Navigate to="/admin/login" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;