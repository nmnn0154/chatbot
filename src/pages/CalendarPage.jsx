import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedEvents, BORROWER_TYPES } from '../lib/calendarApi';
import { CalendarDays, MessageSquare, Clock } from 'lucide-react';

const fmt = (d, withYear = true) =>
  d
    ? new Date(d).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        ...(withYear ? { year: 'numeric' } : {}),
      })
    : '';

/** "1 พ.ค. – 30 มิ.ย. 2568" — year only shown once, at the end. */
function dateRange(start, end) {
  if (!end || end === start) return fmt(start);
  const sameYear = new Date(start).getFullYear() === new Date(end).getFullYear();
  return `${fmt(start, !sameYear)} – ${fmt(end)}`;
}

function eventStatus(ev) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(ev.start_date);
  const end = new Date(ev.end_date || ev.start_date);
  end.setHours(23, 59, 59, 999);
  if (end < today) return 'past';
  if (start <= today && today <= end) return 'active';
  return 'upcoming';
}

const STATUS_LABEL = {
  active: { text: 'กำลังดำเนินการ', color: 'var(--color-success)' },
  upcoming: { text: 'กำลังจะถึง', color: 'var(--color-primary)' },
  past: { text: 'สิ้นสุดแล้ว', color: 'var(--color-text-muted)' },
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ทั้งหมด');

  useEffect(() => {
    getPublishedEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const list = events
      .filter((e) => filter === 'ทั้งหมด' || e.borrower_type === 'ทั้งหมด' || e.borrower_type === filter)
      .map((e) => ({ ...e, _status: eventStatus(e) }));
    const rank = { active: 0, upcoming: 1, past: 2 };
    return list.sort((a, b) => rank[a._status] - rank[b._status] || new Date(a.start_date) - new Date(b.start_date));
  }, [events, filter]);

  return (
    <div className="page-container animate-fade-in" id="calendar-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>ปฏิทินการดำเนินงาน กยศ.</h1>
          <p>กำหนดการเปิด-ปิดรับสมัคร ส่งเอกสาร และทำสัญญา ประจำปีการศึกษา</p>
        </div>
        <Link to="/chat" className="btn btn-primary">
          <MessageSquare size={18} />
          กลับไปหน้าแชท
        </Link>
      </div>

      <div className="toolbar" style={{ gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        {BORROWER_TYPES.map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(t)}
          >
            {t === 'ทั้งหมด' ? 'ทุกประเภท' : `ผู้กู้${t}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner"></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={48} />
          <p>ยังไม่มีข้อมูลปฏิทินการดำเนินงานในขณะนี้</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ overflow: 'visible' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visible.map((ev, i) => {
              const st = STATUS_LABEL[ev._status];
              const isPast = ev._status === 'past';
              return (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md) var(--space-lg)',
                    borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
                    color: isPast ? 'var(--color-text-muted)' : 'inherit',
                  }}
                >
                  <div style={{ flexShrink: 0, width: 8, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, display: 'block' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className="badge badge-indigo">{ev.category}</span>
                      {ev.borrower_type !== 'ทั้งหมด' && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>ผู้กู้{ev.borrower_type}</span>
                      )}
                      {ev.term && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          ภาคเรียนที่ {ev.term}{ev.academic_year ? `/${ev.academic_year}` : ''}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{ev.title}</h3>
                    {ev.description && (
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 2, whiteSpace: 'pre-line' }}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: st.color }}>
                      <Clock size={12} /> {st.text}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: 4, whiteSpace: 'nowrap' }}>
                      {dateRange(ev.start_date, ev.end_date)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
