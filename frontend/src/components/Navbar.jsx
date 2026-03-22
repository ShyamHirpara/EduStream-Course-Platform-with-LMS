import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, LayoutDashboard, LogIn, UserPlus, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__logo" style={{ textDecoration: 'none' }}>
            <GraduationCap size={22} />
            EduStream
          </Link>

          {/* Links */}
          <div className="navbar__links">
            <Link to="/courses" className={isActive('/courses')}>
              <BookOpen size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Courses
            </Link>

            {!user ? (
              <>
                <Link to="/login" className={isActive('/login')}>
                  <LogIn size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  <UserPlus size={15} />
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <span className={`badge badge-${user.role}`}>{user.role}</span>
                <Link to="/dashboard" className={isActive('/dashboard')}>
                  <LayoutDashboard size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  {user.role === 'instructor' ? 'My Courses' : 'Dashboard'}
                </Link>
                <button className="btn btn-outline" onClick={handleLogout}>
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            )}

            {/* ── Theme Toggle ── */}
            <button
              id="theme-toggle"
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
