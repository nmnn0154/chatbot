import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  HelpCircle,
  Megaphone,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin', label: 'ภาพรวมระบบ', icon: LayoutDashboard, exact: true },
  { to: '/admin/knowledge', label: 'จัดการความรู้', icon: BookOpen },
  { to: '/admin/knowledge-base', label: 'ฐานข้อมูล AI', icon: Layers },
  { to: '/admin/faqs', label: 'จัดการ FAQ', icon: HelpCircle },
  { to: '/admin/news', label: 'จัดการข่าวสาร', icon: Megaphone },
  { to: '/admin/calendar', label: 'จัดการปฏิทิน', icon: CalendarDays },
];

export default function AdminSubNav() {
  const location = useLocation();

  return (
    <div className="admin-subnav-container">
      <div className="admin-subnav-inner">
        <div className="admin-subnav-badge">
          <ShieldCheck size={14} />
          <span>แอดมิน</span>
        </div>

        <nav className="admin-subnav-list" aria-label="เมนูระบบจัดการ">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to);

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={`admin-subnav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className="admin-subnav-icon" />
                <span className="admin-subnav-text">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
