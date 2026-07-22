import { Link } from 'react-router-dom';
import { Home, MessageSquare } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="not-found-page animate-fade-in">
      <div className="not-found-code">404</div>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
        ไม่พบหน้าที่ค้นหา
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
        หน้าที่คุณกำลังมองหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่สามารถเข้าถึงได้ชั่วคราว
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
        <Link to="/" className="btn btn-primary">
          <Home size={18} />
          หน้าหลัก
        </Link>
        <Link to="/chat" className="btn btn-secondary">
          <MessageSquare size={18} />
          แชท
        </Link>
      </div>
    </div>
  );
}
