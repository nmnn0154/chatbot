import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Eager load critical entry pages
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

// Lazy load secondary and heavy admin pages (e.g. pdfjs-dist, xlsx)
const FAQPage = lazy(() => import('./pages/FAQPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const KnowledgeBase = lazy(() => import('./pages/admin/KnowledgeBase'));
const AdminFaq = lazy(() => import('./pages/admin/AdminFaq'));
const AdminNews = lazy(() => import('./pages/admin/AdminNews'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected - User */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/faqs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FAQPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Protected - Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/knowledge-base"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <KnowledgeBase />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faqs"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminFaq />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/news"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminNews />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/chat" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
