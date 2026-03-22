import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import HomePage         from './pages/HomePage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import CourseCatalog    from './pages/CourseCatalog';
import CourseDetail     from './pages/CourseDetail';
import Dashboard        from './pages/Dashboard';
import CreateCoursePage from './pages/CreateCoursePage';
import EditCoursePage   from './pages/EditCoursePage';
import LessonViewPage   from './pages/LessonViewPage';


export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/"            element={<HomePage />} />
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/register"    element={<RegisterPage />} />
            <Route path="/courses"     element={<CourseCatalog />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/create"
              element={<ProtectedRoute role="instructor"><CreateCoursePage /></ProtectedRoute>}
            />
            <Route
              path="/courses/:id/edit"
              element={<ProtectedRoute role="instructor"><EditCoursePage /></ProtectedRoute>}
            />
            <Route
              path="/courses/:courseId/learn/:lessonId"
              element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>}
            />
            <Route
              path="/courses/:courseId/learn"
              element={<ProtectedRoute><LessonViewPage /></ProtectedRoute>}
            />
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
