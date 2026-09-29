import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getChatHistory, deleteChatFromLocal, clearAllChatHistory } from '../lib/chatApi';
import { confirmDelete, showSuccess } from '../lib/swalHelper';
import {
  MessageSquare,
  LayoutDashboard,
  BookOpen,
  History,
  Trash2,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Megaphone,
  CalendarDays,
  Layers,
  ShieldCheck,
  GraduationCap,
  Phone,
  Globe,
  FileText,
} from 'lucide-react';

function getPageTitle(pathname) {
  if (pathname === '/chat') return 'กยศ. Chatbot';
  if (pathname === '/knowledge') return 'องค์ความรู้ กยศ.';
  if (pathname === '/faqs') return 'คำถามที่พบบ่อย (FAQ)';
  if (pathname === '/news') return 'ข่าวสารและประกาศ';
  if (pathname === '/calendar') return 'ปฏิทิน กยศ.';
  if (pathname === '/documents') return 'ตัวอย่างเอกสาร & แบบฟอร์ม';
  if (pathname === '/admin') return 'แดชบอร์ดแอดมิน';
  if (pathname === '/admin/knowledge') return 'จัดการองค์ความรู้';
  if (pathname === '/admin/knowledge-base') return 'ฐานข้อมูล AI';
  if (pathname === '/admin/faqs') return 'จัดการ FAQ';
  if (pathname === '/admin/news') return 'จัดการข่าวสาร';
  if (pathname === '/admin/calendar') return 'จัดการปฏิทิน';
  if (pathname === '/admin/documents') return 'จัดการตัวอย่างเอกสาร';
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

  const handleDeleteChat = async (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    const isConfirmed = await confirmDelete({
      title: 'ลบประวัติการสนทนานี้?',
      text: 'ข้อความนี้จะถูกลบออกจากรายการของคุณ',
      confirmText: 'ลบเลย',
      cancelText: 'ยกเลิก',
    });

    if (isConfirmed) {
      deleteChatFromLocal(chatId, profile?.id);
      const updated = getChatHistory(profile?.id);
      setRecentChats(updated);
      window.dispatchEvent(new Event('chatHistoryUpdated'));

      if (currentChatId === chatId) {
        navigate('/chat');
      }
    }
  };

  const handleClearAllHistory = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isConfirmed = await confirmDelete({
      title: 'ล้างประวัติการสนทนาทั้งหมด?',
      text: 'ประวัติการแชททั้งหมดของคุณจะถูกลบถาวร ไม่สามารถกู้คืนได้',
      confirmText: 'ใช่, ล้างทั้งหมด',
      cancelText: 'ยกเลิก',
    });

    if (isConfirmed) {
      clearAllChatHistory(profile?.id);
      setRecentChats([]);
      window.dispatchEvent(new Event('chatHistoryUpdated'));
      showSuccess('ล้างประวัติการสนทนาเรียบร้อยแล้ว');
      if (currentChatId) {
        navigate('/chat');
      }
    }
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
          <NavLink
            to="/documents"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <FileText size={20} />
            ดาวน์โหลดเอกสาร  
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
              <NavLink
                to="/admin/documents"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FileText size={20} />
                จัดการตัวอย่างเอกสาร
              </NavLink>
            </>
          )}

          {/* User History Section */}
          {recentChats.length > 0 && (
            <>
              <div className="sidebar-divider" />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
              }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  หัวข้อที่เคยคุย
                </span>
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="sidebar-clear-all-btn"
                  title="ล้างประวัติการสนทนาทั้งหมด"
                >
                  ล้างทั้งหมด
                </button>
              </div>
              <div className="sidebar-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recentChats.map(chat => {
                  const isActive = currentChatId === chat.id;
                  return (
                    <div
                      key={chat.id}
                      className={`sidebar-history-item ${isActive ? 'active' : ''}`}
                    >
                      <Link
                        to={`/chat?id=${chat.id}`}
                        className="sidebar-history-link"
                        onClick={closeSidebar}
                        title={chat.user_message}
                      >
                        <History size={16} />
                        <span className="sidebar-history-text">
                          {chat.user_message.length > 25 ? chat.user_message.substring(0, 25) + '...' : chat.user_message}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="sidebar-history-delete-btn"
                        title="ลบแชทนี้"
                        aria-label="ลบแชทนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
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
              <div className="sidebar-user-name" title={profile?.full_name || 'ผู้ใช้'}>
                {profile?.full_name || 'ผู้ใช้'}
              </div>
              <div className="sidebar-user-role">
                <span className={`sidebar-role-badge ${isAdmin ? 'admin' : 'user'}`}>
                  {isAdmin ? 'ผู้ดูแลระบบ / บุคลากร' : 'ผู้ใช้ / นักศึกษา'}
                </span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon sidebar-logout-btn"
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
        {children}
        {location.pathname !== '/chat' && (
          <footer className="app-footer">
            <div className="app-footer-left">
              <GraduationCap size={16} className="app-footer-icon" />
              <span>
                <strong>กองพัฒนานักศึกษา</strong> มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย
              </span>
            </div>
            <div className="app-footer-right">
              <span className="app-footer-contact">
                <Phone size={13} />
                <span>กยศ. Call Center 0-2016-4888</span>
              </span>
              <span className="app-footer-divider">•</span>
              <a
                href="https://www.rmutsv.ac.th"
                target="_blank"
                rel="noreferrer"
                className="app-footer-link"
              >
                <Globe size={13} />
                <span>www.rmutsv.ac.th</span>
              </a>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
