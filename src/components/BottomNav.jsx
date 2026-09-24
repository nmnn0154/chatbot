import { NavLink, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  BookOpen,
  HelpCircle,
  Megaphone,
  CalendarDays,
  LayoutDashboard,
} from 'lucide-react';

export default function BottomNav({ isAdmin }) {
  const location = useLocation();

  const navItems = [
    { to: '/chat', label: 'แชท AI', icon: MessageSquare },
    { to: '/knowledge', label: 'คลังความรู้', icon: BookOpen },
    { to: '/faqs', label: 'คำถาม FAQ', icon: HelpCircle },
    { to: '/news', label: 'ข่าวสาร', icon: Megaphone },
    isAdmin
      ? { to: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard }
      : { to: '/calendar', label: 'ปฏิทิน', icon: CalendarDays },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="แถบเมนูหลักสำหรับมือถือ">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/admin'
              ? location.pathname.startsWith('/admin')
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`mobile-bottom-nav-link ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-bottom-nav-icon-wrapper">
                <Icon size={20} />
              </div>
              <span className="mobile-bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
