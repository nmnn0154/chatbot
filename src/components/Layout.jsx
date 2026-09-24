import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getChatHistory } from '../lib/chatApi';
import {
  MessageSquare,
  LayoutDashboard,
  BookOpen,
  History,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Megaphone,
  CalendarDays,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import AdminSubNav from './admin/AdminSubNav';
import BottomNav from './BottomNav';

function getPageTitle(pathname) {
  if (pathname === '/chat') return 'กยศ. Chatbot';
  if (pathname === '/knowledge') return 'องค์ความรู้ กยศ.';
  if (pathname === '/faqs') return 'คำถามที่พบบ่อย (FAQ)';
  if (pathname === '/news') return 'ข่าวสารและประกาศ';
  if (pathname === '/calendar') return 'ปฏิทิน กยศ.';
  if (pathname === '/admin') return 'แดชบอร์ดแอดมิน';
  if (pathname === '/admin/knowledge') return 'จัดการองค์ความรู้';
  if (pathname === '/admin/knowledge-base') return 'ฐานข้อมูล AI';
  if (pathname === '/admin/faqs') return 'จัดการ FAQ';
  if (pathname === '/admin/news') return 'จัดการข่าวสาร';
  if (pathname === '/admin/calendar') return 'จัดการปฏิทิน';
  return 'กยศ. Chatbot';
}

export default function Layout({ children }) {
  const { profile, isAdmin, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentChatId = searchParams.get('id');

  useEffect(() => {
    if (loading) return; // Wait until auth state is resolved

    const loadHistory = () => {
      const history = getChatHistory(profile?.id);
      setRecentChats(history);
    };
    
    loadHistory();
    
    window.addEventListener('chatHistoryUpdated', loadHistory);
    return () => window.removeEventListener('chatHistoryUpdated', loadHistory);
  }, [profile?.id, loading]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const userInitial = profile?.full_name?.charAt(0) || 'U';

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">กยศ.</div>
          <div className="sidebar-brand">
            <h1>กยศ. Chatbot</h1>
            <p>มทร.ศรีวิชัย</p>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={closeSidebar}
            style={{ display: sidebarOpen ? 'flex' : 'none' }}
            aria-label="ปิดเมนู"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {isAdmin && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '0.5rem 0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              ผู้ใช้
            </div>
          )}
          <NavLink
            to="/chat"
            className={({ isActive }) => `sidebar-nav-link ${isActive && !currentChatId ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <MessageSquare size={20} />
            แชทใหม่
          </NavLink>
          <NavLink
            to="/knowledge"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <BookOpen size={20} />
            องค์ความรู้ กยศ.
          </NavLink>
          <NavLink
            to="/faqs"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <HelpCircle size={20} />
            คำถามที่พบบ่อย (FAQ)
          </NavLink>
          <NavLink
            to="/news"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <Megaphone size={20} />
            ข่าวสารและประกาศ
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <CalendarDays size={20} />
            ปฏิทินการดำเนินงาน
          </NavLink>

          {isAdmin && (
            <>
              <div className="sidebar-divider" />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '0.5rem 0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                ผู้ดูแลระบบ
              </div>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <LayoutDashboard size={20} />
                แดชบอร์ด
              </NavLink>
              <NavLink
                to="/admin/knowledge"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <BookOpen size={20} />
                จัดการองค์ความรู้
              </NavLink>
              <NavLink
                to="/admin/knowledge-base"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Layers size={20} />
                ฐานข้อมูล AI
              </NavLink>
              <NavLink
                to="/admin/faqs"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <HelpCircle size={20} />
                จัดการ FAQ
              </NavLink>
              <NavLink
                to="/admin/news"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Megaphone size={20} />
                จัดการข่าวสาร
              </NavLink>
              <NavLink
                to="/admin/calendar"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <CalendarDays size={20} />
                จัดการปฏิทิน
              </NavLink>
            </>
          )}

          {/* User History Section */}
          {recentChats.length > 0 && (
            <>
              <div className="sidebar-divider" />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '0.5rem 0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                หัวข้อที่เคยคุย
              </div>
              <div className="sidebar-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recentChats.map(chat => (
                  <Link
                    key={chat.id}
                    to={`/chat?id=${chat.id}`}
                    className={`sidebar-nav-link ${currentChatId === chat.id ? 'active' : ''}`}
                    onClick={closeSidebar}
                    style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <History size={16} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.user_message.length > 25 ? chat.user_message.substring(0, 25) + '...' : chat.user_message}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} referrerPolicy="no-referrer" />
              ) : (
                userInitial
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.full_name || 'ผู้ใช้'}</div>
              <div className="sidebar-user-role">
                {isAdmin ? '👑 ผู้ดูแลระบบ' : '👤 ผู้ใช้'}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={handleSignOut}
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu size={22} />
          </button>
          <div className="topbar-brand" style={{ minWidth: 0 }}>
            <div className="topbar-logo" style={{ flexShrink: 0 }}>กยศ.</div>
            <span className="topbar-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getPageTitle(location.pathname)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {isAdmin && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <ShieldCheck size={11} /> แอดมิน
            </span>
          )}
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleSignOut}
            aria-label="ออกจากระบบ"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {isAdmin && location.pathname.startsWith('/admin') && <AdminSubNav />}
        {children}
        {location.pathname !== '/chat' && (
          <footer className="app-footer">
            <span>
              <strong>กองพัฒนานักศึกษา</strong> มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย
            </span>
            <span>
              กยศ. Call Center 0-2016-4888 ·{' '}
              <a href="https://www.rmutsv.ac.th" target="_blank" rel="noreferrer">
                www.rmutsv.ac.th
              </a>
            </span>
          </footer>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
